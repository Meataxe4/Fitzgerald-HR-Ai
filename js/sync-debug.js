// Simple manual sync functions for testing
async function manualSyncToCloud() {
    const status = document.getElementById('syncStatus');
    status.innerHTML = '⏳ Saving to cloud...';
    
    if (!currentUser || !db) {
        status.innerHTML = '❌ Error: Not signed in!';
        return;
    }
    
    try {
        const allData = {
            conversations: JSON.parse(localStorage.getItem('fitz_conversations') || '[]'),
            contracts: [],
            checklists: [],
            trainingPlans: [],
            timestamp: new Date().toISOString()
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('contract_')) {
                try { allData.contracts.push(JSON.parse(localStorage.getItem(key))); } catch (e) {}
            }
            if (key && key.startsWith('checklist_')) {
                try { allData.checklists.push(JSON.parse(localStorage.getItem(key))); } catch (e) {}
            }
            if (key && key.startsWith('training_plan_')) {
                try { allData.trainingPlans.push(JSON.parse(localStorage.getItem(key))); } catch (e) {}
            }
        }
        
        await db.collection('users').doc(currentUser.uid).set({
            syncedData: allData,
            lastSync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        status.innerHTML = `✅ Synced to cloud!<br>
        📝 ${allData.conversations.length} conversations<br>
        📄 ${allData.contracts.length} contracts<br>
        ✔️ ${allData.checklists.length} checklists<br>
        📚 ${allData.trainingPlans.length} training plans`;
        
    } catch (error) {
        status.innerHTML = '❌ Error: ' + error.message;
    }
}

async function manualLoadFromCloud() {
    const status = document.getElementById('syncStatus');
    status.innerHTML = '⏳ Loading from cloud...';
    
    if (!currentUser || !db) {
        status.innerHTML = '❌ Error: Not signed in!';
        return;
    }
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        
        if (!doc.exists || !doc.data().syncedData) {
            status.innerHTML = '📭 No cloud data found';
            return;
        }
        
        const cloudData = doc.data().syncedData;
        
        if (cloudData.conversations?.length > 0) {
            localStorage.setItem('fitz_conversations', JSON.stringify(cloudData.conversations));
            conversations = cloudData.conversations;
        }
        if (cloudData.contracts?.length > 0) {
            cloudData.contracts.forEach(c => localStorage.setItem('contract_' + c.contractId, JSON.stringify(c)));
        }
        if (cloudData.checklists?.length > 0) {
            cloudData.checklists.forEach(c => localStorage.setItem('checklist_' + c.checklistId, JSON.stringify(c)));
        }
        if (cloudData.trainingPlans?.length > 0) {
            cloudData.trainingPlans.forEach(p => localStorage.setItem('training_plan_' + p.planId, JSON.stringify(p)));
        }
        
        status.innerHTML = `✅ Loaded from cloud!<br>
        📝 ${cloudData.conversations?.length || 0} conversations<br>
        📄 ${cloudData.contracts?.length || 0} contracts<br>
        ✔️ ${cloudData.checklists?.length || 0} checklists<br>
        📚 ${cloudData.trainingPlans?.length || 0} training plans<br><br>
        🔄 Refresh page to see changes`;
        
        showAlert('✅ Data loaded! Refresh the page to see everything.');
        
    } catch (error) {
        status.innerHTML = '❌ Error: ' + error.message;
    }
}

async function checkFirestoreData() {
    const status = document.getElementById('syncStatus');
    status.innerHTML = '⏳ Checking Firestore...';
    
    if (!currentUser || !db) {
        status.innerHTML = '❌ Error: Not signed in!';
        return;
    }
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        
        if (!doc.exists) {
            status.innerHTML = '📭 No user document found';
            return;
        }
        
        const data = doc.data();
        const syncedData = data.syncedData || {};
        
        status.innerHTML = `📊 Firestore Data:<br>
        User ID: ${currentUser.uid}<br>
        Email: ${currentUser.email}<br>
        Last Sync: ${data.lastSync ? new Date(data.lastSync.toDate()).toLocaleString() : 'Never'}<br><br>
        📝 ${syncedData.conversations?.length || 0} conversations<br>
        📄 ${syncedData.contracts?.length || 0} contracts<br>
        ✔️ ${syncedData.checklists?.length || 0} checklists<br>
        📚 ${syncedData.trainingPlans?.length || 0} training plans`;
        
    } catch (error) {
        status.innerHTML = '❌ Error: ' + error.message;
    }
}
