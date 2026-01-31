// netlify/functions/deputy-sync-rosters.js
// Syncs rosters from Deputy - supports both OAuth and token auth

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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { user_id, access_token, supabase_url, supabase_key } = JSON.parse(event.body);

        if (!user_id) {
            throw new Error('User ID is required');
        }

        let deputyToken = access_token;

        // If no token provided, get it from Supabase
        if (!deputyToken && supabase_url && supabase_key) {
            const supabase = require('@supabase/supabase-js');
            const supabaseClient = supabase.createClient(supabase_url, supabase_key);

            const { data: integration } = await supabaseClient
                .from('integrations')
                .select('*')
                .eq('user_id', user_id)
                .eq('platform', 'deputy')
                .eq('is_active', true)
                .single();

            if (!integration) {
                throw new Error('Deputy not connected');
            }

            deputyToken = integration.access_token;
        }

        if (!deputyToken) {
            throw new Error('No Deputy access token available');
        }

        console.log('Fetching rosters from Deputy...');

        const startDate = formatDate(new Date());
        const endDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

        const rostersResponse = await fetch(
            `https://once.deputy.com/api/v1/resource/Roster/QUERY?search[Date][from]=${startDate}&search[Date][to]=${endDate}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${deputyToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }
        );

        if (!rostersResponse.ok) {
            const errorText = await rostersResponse.text();
            throw new Error(`Deputy API error: ${rostersResponse.status} - ${errorText}`);
        }

        const rosters = await rostersResponse.json();
        console.log(`Fetched ${rosters.length} rosters`);

        // Process rosters with compliance checking
        const processedRosters = rosters.map(roster => {
            const shiftDate = new Date(roster.Date * 1000);
            const totalHours = calculateHours(roster.StartTime, roster.EndTime, roster.TotalBreak || 0);
            const compliance = analyzeCompliance(shiftDate, totalHours);

            return {
                id: roster.Id.toString(),
                employee: {
                    id: roster.Employee,
                    name: `Employee ${roster.Employee}`,
                    externalId: roster.Employee
                },
                position: 'Staff Member',
                date: shiftDate.toLocaleDateString('en-AU'),
                startTime: formatTime(roster.StartTime),
                endTime: formatTime(roster.EndTime),
                totalHours: totalHours,
                baseRate: 25.00,
                compliance: compliance,
                raw: roster
            };
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                rosters: processedRosters,
                total: processedRosters.length,
                issues: processedRosters.filter(r => !r.compliance.isCompliant).length
            })
        };

    } catch (error) {
        console.error('Roster sync error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

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

function analyzeCompliance(shiftDate, totalHours) {
    const warnings = [];
    let penaltyMultiplier = 1.0;
    const baseRate = 25.00;
    const dayOfWeek = shiftDate.getDay();

    if (dayOfWeek === 0) {
        penaltyMultiplier = 1.75;
        warnings.push({
            type: 'Sunday Penalty Rate',
            severity: 'info',
            message: 'Sunday work requires 175% penalty rate',
            multiplier: 1.75
        });
    }

    if (dayOfWeek === 6) {
        penaltyMultiplier = 1.5;
        warnings.push({
            type: 'Saturday Penalty Rate',
            severity: 'info',
            message: 'Saturday work requires 150% penalty rate',
            multiplier: 1.5
        });
    }

    if (totalHours < 3) {
        warnings.push({
            type: 'Minimum Engagement Breach',
            severity: 'high',
            message: `Shift is ${totalHours.toFixed(1)}h but minimum is 3 hours`
        });
    }

    const totalCost = totalHours * baseRate * penaltyMultiplier;

    return {
        isCompliant: warnings.filter(w => w.severity === 'high').length === 0,
        warnings: warnings,
        penaltyMultiplier: penaltyMultiplier,
        totalCost: totalCost
    };
}
