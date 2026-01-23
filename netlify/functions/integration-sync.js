// netlify/functions/integration-sync.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { integrationId, user } = JSON.parse(event.body);
        
        console.log('🔄 Syncing data for:', integrationId, user);
        
        // In production: Fetch real data from integration APIs
        // For now, return mock data
        
        let syncData = {};
        
        if (integrationId === 'deputy' || integrationId === 'tanda' || integrationId === 'wheniwork') {
            // Rostering data
            syncData = {
                totalShifts: 47,
                totalHours: 312,
                estimatedCost: 8945,
                issues: [
                    'Sarah scheduled 6 consecutive days (max 5 recommended)',
                    'John\'s Thursday shift: 8 hours with no meal break'
                ]
            };
        } else if (integrationId === 'square' || integrationId === 'lightspeed' || integrationId === 'toast') {
            // POS data
            syncData = {
                totalSales: 24780,
                labourCost: 7845,
                labourPercentage: 31.7
            };
        } else {
            // Payroll data
            syncData = {
                totalEmployees: 23,
                estimatedPayroll: 18450,
                super: 1845
            };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(syncData)
        };
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
