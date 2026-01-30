// netlify/functions/deputy-sync-rosters.js
// Syncs rosters from Deputy and analyzes them for Australian Award compliance

const fetch = require('node-fetch');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { user_id, supabase_url, supabase_key } = JSON.parse(event.body);

        if (!user_id || !supabase_url || !supabase_key) {
            throw new Error('Missing required parameters');
        }

        const supabase = require('@supabase/supabase-js');
        const supabaseClient = supabase.createClient(supabase_url, supabase_key);

        console.log('Fetching Deputy integration for user:', user_id);

        const { data: integration, error: intError } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('user_id', user_id)
            .eq('platform', 'deputy')
            .eq('is_active', true)
            .single();

        if (intError || !integration) {
            throw new Error('Deputy not connected. Please connect Deputy first.');
        }

        const tokenExpiry = new Date(integration.token_expires_at);
        const now = new Date();
        
        if (tokenExpiry < now) {
            console.log('Token expired, refreshing...');
            integration.access_token = await refreshDeputyToken(integration, supabaseClient);
        }

        const domain = integration.settings?.domain || 'once';
        const accessToken = integration.access_token;

        const startDate = formatDate(new Date());
        const endDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

        console.log(`Fetching rosters from ${startDate} to ${endDate}`);

        const rostersResponse = await fetch(
            `https://${domain}.deputy.com/api/v1/resource/Roster/QUERY?` + 
            `search[Date][from]=${startDate}&` +
            `search[Date][to]=${endDate}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'dp-meta-option': 'OnlyDomainData'
                },
                body: JSON.stringify({})
            }
        );

        if (!rostersResponse.ok) {
            const errorText = await rostersResponse.text();
            throw new Error(`Deputy API error: ${rostersResponse.status} - ${errorText}`);
        }

        const rosters = await rostersResponse.json();
        console.log(`Fetched ${rosters.length} rosters from Deputy`);

        if (rosters.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    rosters: [],
                    total: 0,
                    issues: 0,
                    message: 'No rosters found for the next 30 days'
                })
            };
        }

        const employeeIds = [...new Set(rosters.map(r => r.Employee))];
        console.log(`Fetching ${employeeIds.length} employee details`);

        const employees = await fetchDeputyEmployees(domain, accessToken, employeeIds);

        const processedRosters = await Promise.all(
            rosters.map(async (roster) => {
                const employee = employees.find(e => e.Id === roster.Employee);
                
                const shiftDate = new Date(roster.Date * 1000);
                const totalHours = calculateHours(roster.StartTime, roster.EndTime, roster.TotalBreak || 0);
                
                const compliance = await analyzeRosterCompliance({
                    startTime: roster.StartTime,
                    endTime: roster.EndTime,
                    date: shiftDate,
                    breakMinutes: roster.TotalBreak || 0,
                    totalHours: totalHours,
                    classification: employee?.DisplayName || 'Unknown',
                    isPublicHoliday: await isAustralianPublicHoliday(shiftDate)
                });

                return {
                    id: roster.Id.toString(),
                    employee: {
                        id: employee?.Id,
                        name: employee?.DisplayName || 'Unknown',
                        externalId: roster.Employee
                    },
                    position: employee?.DisplayName || 'Unknown',
                    date: formatDate(shiftDate),
                    startTime: formatTime(roster.StartTime),
                    endTime: formatTime(roster.EndTime),
                    totalHours: totalHours,
                    baseRate: 25.00,
                    compliance: compliance,
                    raw: roster
                };
            })
        );

        const rostersToSave = processedRosters.map(r => ({
            user_id: user_id,
            external_id: r.id,
            platform: 'deputy',
            employee_name: r.employee.name,
            shift_date: r.date,
            start_time: r.startTime,
            end_time: r.endTime,
            total_hours: r.totalHours,
            base_rate: r.baseRate,
            penalty_multiplier: r.compliance.penaltyMultiplier,
            total_cost: r.compliance.totalCost,
            is_compliant: r.compliance.isCompliant,
            compliance_issues: r.compliance.warnings,
            raw_data: r.raw,
            synced_from: 'deputy',
            last_synced: new Date().toISOString()
        }));

        const { error: saveError } = await supabaseClient
            .from('rosters')
            .upsert(rostersToSave, { onConflict: 'user_id,platform,external_id' });

        if (saveError) {
            console.error('Supabase save error:', saveError);
        }

        await supabaseClient.from('sync_logs').insert({
            integration_id: integration.id,
            user_id: user_id,
            sync_type: 'roster',
            status: 'success',
            records_synced: processedRosters.length,
            metadata: {
                date_range: { start: startDate, end: endDate },
                issues_found: processedRosters.filter(r => !r.compliance.isCompliant).length
            }
        });

        await supabaseClient
            .from('integrations')
            .update({ last_synced: new Date().toISOString() })
            .eq('id', integration.id);

        console.log('Roster sync completed successfully');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                rosters: processedRosters,
                total: processedRosters.length,
                issues: processedRosters.filter(r => !r.compliance.isCompliant).length,
                message: `Synced ${processedRosters.length} rosters successfully`
            })
        };

    } catch (error) {
        console.error('Roster sync error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to sync rosters'
            })
        };
    }
};

async function fetchDeputyEmployees(domain, accessToken, employeeIds) {
    const employees = [];
    const batchSize = 10;
    
    for (let i = 0; i < employeeIds.length; i += batchSize) {
        const batch = employeeIds.slice(i, i + batchSize);
        
        const promises = batch.map(async (id) => {
            try {
                const response = await fetch(
                    `https://${domain}.deputy.com/api/v1/resource/Employee/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                console.error(`Failed to fetch employee ${id}:`, err);
            }
            return null;
        });
        
        const results = await Promise.all(promises);
        employees.push(...results.filter(e => e !== null));
        
        if (i + batchSize < employeeIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return employees;
}

async function analyzeRosterCompliance(shift) {
    const warnings = [];
    let penaltyMultiplier = 1.0;
    const baseRate = 25.00;

    const shiftDate = shift.date;
    const dayOfWeek = shiftDate.getDay();

    if (dayOfWeek === 0) {
        penaltyMultiplier = 1.75;
        warnings.push({
            type: 'Sunday Penalty Rate',
            severity: 'info',
            message: 'Sunday work requires 175% penalty rate',
            multiplier: 1.75,
            suggestion: 'Ensure payroll reflects Sunday penalty rates',
            reference: 'Restaurant Industry Award 2020 - Clause 30.3'
        });
    }

    if (dayOfWeek === 6) {
        penaltyMultiplier = 1.5;
        warnings.push({
            type: 'Saturday Penalty Rate',
            severity: 'info',
            message: 'Saturday work requires 150% penalty rate',
            multiplier: 1.5,
            suggestion: 'Ensure payroll reflects Saturday penalty rates',
            reference: 'Restaurant Industry Award 2020 - Clause 30.2'
        });
    }

    if (shift.isPublicHoliday) {
        penaltyMultiplier = 2.5;
        warnings.push({
            type: 'Public Holiday Penalty',
            severity: 'high',
            message: 'Public holiday work requires 250% penalty rate',
            multiplier: 2.5,
            suggestion: 'Employee may also be entitled to day-in-lieu',
            reference: 'Restaurant Industry Award 2020 - Clause 37'
        });
    }

    if (shift.totalHours < 3) {
        warnings.push({
            type: 'Minimum Engagement Breach',
            severity: 'high',
            message: `Shift is ${shift.totalHours.toFixed(1)}h but minimum is 3 hours`,
            suggestion: 'Must pay for minimum 3 hours or extend shift',
            reference: 'Restaurant Industry Award 2020 - Clause 25.2'
        });
    }

    const totalCost = shift.totalHours * baseRate * penaltyMultiplier;

    return {
        isCompliant: warnings.length === 0,
        warnings: warnings,
        penaltyMultiplier: penaltyMultiplier,
        totalCost: totalCost,
        breakdown: {
            baseHours: shift.totalHours,
            baseRate: baseRate,
            penaltyRate: baseRate * penaltyMultiplier,
            totalCost: totalCost
        }
    };
}

async function isAustralianPublicHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const holidays = [
        { m: 1, d: 1 },
        { m: 1, d: 26 },
        { m: 4, d: 25 },
        { m: 12, d: 25 },
        { m: 12, d: 26 }
    ];
    
    return holidays.some(h => h.m === month && h.d === day);
}

async function refreshDeputyToken(integration, supabaseClient) {
    const response = await fetch('https://once.deputy.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.DEPUTY_CLIENT_ID,
            client_secret: process.env.DEPUTY_CLIENT_SECRET,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token'
        })
    });

    const tokens = await response.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
    
    await supabaseClient
        .from('integrations')
        .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || integration.refresh_token,
            token_expires_at: expiresAt
        })
        .eq('id', integration.id);

    return tokens.access_token;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(timestamp) {
    if (!timestamp) return '00:00';
    const date = new Date(timestamp * 1000);
    return date.toTimeString().slice(0, 5);
}

function calculateHours(startTimestamp, endTimestamp, breakMinutes = 0) {
    const startTime = new Date(startTimestamp * 1000);
    const endTime = new Date(endTimestamp * 1000);
    const diffMs = endTime - startTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakHours = breakMinutes / 60;
    return Math.round((diffHours - breakHours) * 100) / 100;
}
