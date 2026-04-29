// ========================================
// ========================================
// NEW EMPLOYEE TOOLKIT FUNCTIONS
// ========================================

function openNewEmployeeToolkit() {
    const modal = document.getElementById('newEmployeeToolkitModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    trackToolUsage('newEmployeeToolkit');
}

function closeNewEmployeeToolkit() {
    const modal = document.getElementById('newEmployeeToolkitModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Update the main button to open the toolkit instead of contract builder directly
function openEmploymentContractFromMenu() {
    openNewEmployeeToolkit();
    closeToolsMenu();
}

// Rename the contract builder function for clarity
// ========================================
// AI-ENHANCED ONBOARDING CHECKLIST
// ========================================

let onboardingState = {
    employeeName: '',
    position: '',
    employmentType: '',
    startDate: '',
    checklist: [],
    completedTasks: [],
    checklistId: null
};

// Main Functions
function openOnboardingChecklist() {
    const modal = document.getElementById('onboardingChecklistModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    // Try to load saved progress
    loadOnboardingProgress();
    
    trackToolUsage('onboardingChecklist');
}

function closeOnboardingChecklist() {
    const modal = document.getElementById('onboardingChecklistModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Generate Smart Checklist with AI
async function generateSmartChecklist() {
    const employeeName = document.getElementById('onboardingEmployeeName').value.trim();
    const position = document.getElementById('onboardingPosition').value.trim();
    const employmentType = document.getElementById('onboardingEmploymentType').value;
    const startDate = document.getElementById('onboardingStartDate').value;
    
    // Validation
    if (!employeeName || !position || !employmentType || !startDate) {
        showAlert('Please fill in all required fields (Name, Position, Employment Type, Start Date)');
        return;
    }
    
    // Save to state
    onboardingState.employeeName = employeeName;
    onboardingState.position = position;
    onboardingState.employmentType = employmentType;
    onboardingState.startDate = startDate;
    onboardingState.checklistId = 'onboarding_' + Date.now();
    
    // Show loading
    showAIThinking('Analysing role and generating personalised checklist...');
    
    try {
        // Get AI insights
        const insights = await getAIInsights(position, employmentType);
        
        // Generate checklist based on employment type
        const checklist = generateChecklistItems(employmentType, position);
        onboardingState.checklist = checklist;
        
        // Display AI insights
        displayAIInsights(insights);
        
        // Render checklist
        renderChecklist();
        
        // Show progress bar
        document.getElementById('checklistProgressBar').classList.remove('hidden');
        updateProgress();
        
        // Apply blur overlay (user must unlock to download)
        applyUniversalBlur('checklistSections', 'onboardingChecklist', 'Onboarding Checklist', 'checklistActionsContainer');
        
    } catch (error) {
        showAlert('Failed to generate checklist. Please try again.');
    }
}

// Get AI Insights using Claude API
async function getAIInsights(position, employmentType) {
    const prompt = `As an Australian HR expert, provide 3 key insights for onboarding a new ${employmentType} ${position} in the hospitality industry. Focus on:
1. Critical first-week priorities
2. Common compliance issues to avoid
3. Role-specific considerations

Keep it concise, actionable, and specific to Australian hospitality.`;
    
    try {
        const response = await callClaudeAPI(prompt);
        return response;
    } catch (error) {
        return getFallbackInsights(position, employmentType);
    }
}

function getFallbackInsights(position, employmentType) {
    const insights = {
        'full-time': `For full-time ${position} roles:
• Ensure Fair Work Information Statement is provided on day 1
• Set up regular check-ins during the 6-month probation period
• ${position.toLowerCase().includes('chef') ? 'Verify food safety certifications and arrange any required training' : 'Schedule comprehensive role training in first 2 weeks'}`,
        
        'part-time': `For part-time ${position} roles:
• Clarify guaranteed minimum hours and roster patterns from the start
• Ensure pro-rata leave entitlements are clearly explained
• ${position.toLowerCase().includes('front') ? 'Focus on customer service standards training' : 'Provide clear availability requirements and flexibility expectations'}`,
        
        'casual': `For casual ${position} roles:
• Emphasize the 25% casual loading and explain what it covers
• Make it clear that hours are not guaranteed but shifts will be offered
• ${position.toLowerCase().includes('kitchen') ? 'Ensure immediate induction on food safety and kitchen procedures' : 'Fast-track customer service and POS system training'}`
    };
    
    return insights[employmentType] || 'Focus on comprehensive induction, clear communication, and regular feedback.';
}

function displayAIInsights(insights) {
    const insightsBox = document.getElementById('aiInsightsBox');
    const content = document.getElementById('aiInsightsContent');
    
    content.innerHTML = insights.replace(/\n/g, '<br>');
    insightsBox.classList.remove('hidden');
}

function showAIThinking(message) {
    const insightsBox = document.getElementById('aiInsightsBox');
    const content = document.getElementById('aiInsightsContent');
    
    content.innerHTML = `<div class="ai-thinking">${message}</div>`;
    insightsBox.classList.remove('hidden');
}

// Generate Checklist Items
function generateChecklistItems(employmentType, position) {
    const baseItems = [
        {
            id: 1,
            category: 'Legal & Compliance',
            title: 'Provide Fair Work Information Statement',
            hint: 'Must be given before or on the first day of work.',
            link: 'https://www.fairwork.gov.au/employment-conditions/information-statements/fair-work-information-statement',
            linkText: 'Download from Fair Work',
            priority: 'high',
            daysUntil: 0,
            actions: ['Download Template', 'Mark as Given']
        },
        {
            id: 2,
            category: 'Legal & Compliance',
            title: 'Signed Employment Contract',
            hint: 'Ensure both parties have signed the contract and each has a copy.',
            priority: 'high',
            daysUntil: 0,
            actions: ['View Contract', 'Confirm Signed']
        },
        {
            id: 3,
            category: 'Payroll Setup',
            title: 'Collect Tax File Number (TFN) Declaration',
            hint: 'Required for tax purposes.',
            link: 'https://www.ato.gov.au/forms-and-instructions/tax-file-number-declaration',
            linkText: 'Download TFN Declaration Form',
            priority: 'high',
            daysUntil: 1,
            actions: ['Download Form', 'Mark Received']
        },
        {
            id: 4,
            category: 'Payroll Setup',
            title: 'Super Fund Choice Form',
            hint: 'Employee must choose superannuation fund or use your default fund.',
            link: 'https://www.ato.gov.au/forms-and-instructions/superannuation-standard-choice-form',
            linkText: 'Download Super Choice Form',
            priority: 'high',
            daysUntil: 1,
            actions: ['Download Form', 'Mark Completed']
        },
        {
            id: 5,
            category: 'Payroll Setup',
            title: 'Bank Account Details',
            hint: 'For salary/wage payments via direct deposit.',
            priority: 'high',
            daysUntil: 1,
            actions: ['Collect Details', 'Verify']
        },
        {
            id: 6,
            category: 'Payroll Setup',
            title: 'Add to Payroll System',
            hint: 'Set up in Deputy, Xero, or your payroll system with correct pay rate and Award.',
            priority: 'high',
            daysUntil: 2,
            actions: ['Add to System', 'Test Pay Run']
        },
        {
            id: 7,
            category: 'Documentation',
            title: 'Emergency Contact Information',
            hint: 'Collect details of who to contact in case of emergency.',
            priority: 'medium',
            daysUntil: 1,
            actions: ['Collect Info', 'Store Securely']
        },
        {
            id: 8,
            category: 'Documentation',
            title: 'Proof of Working Rights',
            hint: 'Check passport, visa, or citizenship documents to verify right to work in Australia.',
            priority: 'high',
            daysUntil: 0,
            actions: ['Check Documents', 'Keep Copies']
        }
    ];
    
    // Add role-specific items
    if (position.toLowerCase().includes('chef') || position.toLowerCase().includes('kitchen') || position.toLowerCase().includes('cook')) {
        baseItems.push({
            id: 9,
            category: 'Training & Compliance',
            title: 'Food Safety Certificate Verification',
            hint: 'Ensure valid Food Handler certificate (or arrange training within first week).',
            priority: 'high',
            daysUntil: 0,
            actions: ['Check Certificate', 'Arrange Training']
        });
    }
    
    if (employmentType === 'full-time' || employmentType === 'part-time') {
        baseItems.push({
            id: 10,
            category: 'Onboarding',
            title: 'Explain Leave Entitlements',
            hint: 'Annual leave, personal/carer\'s leave, and how to request time off.',
            priority: 'medium',
            daysUntil: 1,
            actions: ['Provide Leave Policy', 'Explain Process']
        });
    }
    
    baseItems.push(
        {
            id: 11,
            category: 'Onboarding',
            title: 'Workplace Induction',
            hint: 'Tour of facilities, introduction to team, key contacts, emergency procedures.',
            priority: 'high',
            daysUntil: 0,
            actions: ['Schedule Tour', 'Complete Checklist']
        },
        {
            id: 12,
            category: 'Onboarding',
            title: 'WHS & Safety Training',
            hint: 'Workplace health and safety procedures, emergency exits, fire drills.',
            priority: 'high',
            daysUntil: 0,
            actions: ['Conduct Training', 'Sign-off']
        },
        {
            id: 13,
            category: 'Training & Compliance',
            title: 'Responsible Service of Alcohol (RSA)',
            hint: 'Required for anyone serving alcohol in Australia.',
            priority: position.toLowerCase().includes('bar') || position.toLowerCase().includes('front') ? 'high' : 'medium',
            daysUntil: position.toLowerCase().includes('bar') ? 0 : 7,
            actions: ['Check Certificate', 'Arrange Training']
        },
        {
            id: 14,
            category: 'Systems & Access',
            title: 'POS System Training',
            hint: 'Show how to use point of sale system for orders and payments.',
            priority: 'high',
            daysUntil: 1,
            actions: ['Book Training', 'Create Login']
        },
        {
            id: 15,
            category: 'Systems & Access',
            title: 'Roster Access',
            hint: 'Add to Deputy or rostering system so they can view shifts.',
            priority: 'medium',
            daysUntil: 2,
            actions: ['Add to System', 'Send Invite']
        },
        {
            id: 16,
            category: 'Onboarding',
            title: 'Uniform & Equipment',
            hint: 'Provide required uniform items and any necessary equipment.',
            priority: 'medium',
            daysUntil: 0,
            actions: ['Issue Uniform', 'Record in System']
        },
        {
            id: 17,
            category: 'Follow-up',
            title: '1-Week Check-in',
            hint: 'Catch up to see how they\'re settling in, answer questions, address concerns.',
            priority: 'medium',
            daysUntil: 7,
            actions: ['Schedule Meeting', 'Complete']
        },
        {
            id: 18,
            category: 'Follow-up',
            title: '1-Month Review',
            hint: 'Formal review of performance, provide feedback, set goals.',
            priority: 'medium',
            daysUntil: 30,
            actions: ['Schedule Review', 'Complete']
        }
    );
    
    if (employmentType === 'full-time' || employmentType === 'part-time') {
        baseItems.push({
            id: 19,
            category: 'Follow-up',
            title: 'End of Probation Review',
            hint: 'Formal review at end of probation period (typically 6 months).',
            priority: 'low',
            daysUntil: 180,
            actions: ['Schedule Review', 'Confirm Continuation']
        });
    }
    
    return baseItems;
}

// Render Checklist
function renderChecklist() {
    const container = document.getElementById('checklistSections');
    
    // Group by category
    const grouped = onboardingState.checklist.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
    
    let html = '';
    
    Object.keys(grouped).forEach(category => {
        const items = grouped[category];
        const categoryId = category.replace(/\s+/g, '-').toLowerCase();
        
        html += `
            <div class="checklist-section">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    ${getCategoryIcon(category)}
                    <span>${category}</span>
                    <span class="text-slate-400 text-sm font-normal ml-auto">${items.filter(i => onboardingState.completedTasks.includes(i.id)).length}/${items.length} completed</span>
                </h3>
                <div class="space-y-2">
                    ${items.map(item => renderChecklistItem(item)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderChecklistItem(item) {
    const isCompleted = onboardingState.completedTasks.includes(item.id);
    
    return `
        <div class="checklist-item ${isCompleted ? 'completed' : ''}" data-item-id="${item.id}">
            <div class="checkbox-custom ${isCompleted ? 'checked' : ''}" 
                 onclick="toggleTaskCompletion(${item.id})"></div>
            <div class="item-content">
                <div class="flex items-start justify-between">
                    <div class="item-text">${item.title}</div>
                    <span class="priority-badge priority-${item.priority}">${item.priority}</span>
                </div>
                <div class="item-hint">${item.hint}</div>
                ${item.link ? `
                    <div class="mt-2">
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" 
                           style="color: #f59e0b; text-decoration: underline; font-size: 13px; display: inline-flex; align-items: center; gap: 4px;">
                            📥 ${item.linkText || 'Download Form'}
                            <span style="font-size: 10px;">↗</span>
                        </a>
                    </div>
                ` : ''}
                ${item.daysUntil !== undefined ? `
                    <div class="text-xs text-slate-400 mt-2">
                        ${item.daysUntil === 0 ? '⚡ Due today' : item.daysUntil === 1 ? '📅 Due tomorrow' : `📅 Due in ${item.daysUntil} days`}
                    </div>
                ` : ''}
                <div class="item-actions">
                    ${item.actions.map(action => `
                        <button class="action-btn" onclick="handleItemAction(${item.id}, '${action}')">${action}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        'Legal & Compliance': '⚖️',
        'Payroll Setup': '💰',
        'Documentation': '📄',
        'Onboarding': '👋',
        'Training & Compliance': '🎓',
        'Systems & Access': '🔐',
        'Follow-up': '📅'
    };
    return icons[category] || '📋';
}

// Toggle Task Completion
function toggleTaskCompletion(itemId) {
    const index = onboardingState.completedTasks.indexOf(itemId);
    
    if (index > -1) {
        onboardingState.completedTasks.splice(index, 1);
    } else {
        onboardingState.completedTasks.push(itemId);
    }
    
    // Re-render
    renderChecklist();
    updateProgress();
    
    // Auto-save
    saveOnboardingProgress();
}

// Update Progress
function updateProgress() {
    const total = onboardingState.checklist.length;
    const completed = onboardingState.completedTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progressPercentage').textContent = percentage + '%';
    document.getElementById('progressBarFill').style.width = percentage + '%';
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('totalTasks').textContent = total;
}

// Handle Item Actions
function handleItemAction(itemId, action) {
    const item = onboardingState.checklist.find(i => i.id === itemId);
    
    if (action.includes('Download')) {
        // Open Fair Work or ATO website
        if (action.includes('TFN') || action.includes('Form')) {
            window.open('https://www.ato.gov.au/forms-and-instructions/tfn-declaration', '_blank');
        } else if (action.includes('Template') || action.includes('Statement')) {
            window.open('https://www.fairwork.gov.au/employment-conditions/starter-pack', '_blank');
        }
    } else if (action.includes('Mark') || action.includes('Confirm') || action.includes('Complete')) {
        // Mark as completed
        toggleTaskCompletion(itemId);
    } else if (action.includes('Schedule')) {
        // Could integrate with calendar
        showAlert(`Action "${action}" - Would integrate with calendar system`);
    } else {
        showAlert(`Action "${action}" for item: ${item.title}`);
    }
}

// AI Assistant
async function askAIAssistant() {
    const question = document.getElementById('aiQuestionInput').value.trim();
    
    if (!question) {
        showAlert('Please enter a question');
        return;
    }
    
    const responseBox = document.getElementById('aiResponseBox');
    const responseContent = document.getElementById('aiResponseContent');
    
    responseBox.classList.remove('hidden');
    responseContent.innerHTML = '<div class="ai-thinking">Thinking</div>';
    
    try {
        const context = `Employee: ${onboardingState.employeeName}, Position: ${onboardingState.position}, Type: ${onboardingState.employmentType}`;
        const prompt = `As an Australian HR expert, answer this onboarding question:\n\nContext: ${context}\n\nQuestion: ${question}\n\nProvide a clear, actionable answer focused on Australian hospitality compliance.`;
        
        const answer = await callClaudeAPI(prompt);
        responseContent.innerHTML = answer.replace(/\n/g, '<br>');
        
        // Clear input
        document.getElementById('aiQuestionInput').value = '';
    } catch (error) {
        responseContent.innerHTML = 'Sorry, I encountered an error. Please try again or contact support.';
    }
}

// Save/Load Progress
function saveOnboardingProgress() {
    if (!onboardingState.checklistId) return;
    
    try {
        const data = {
            ...onboardingState,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('onboarding_' + onboardingState.checklistId, JSON.stringify(data));
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Progress saved', 'success');
        } else {
            showAlert('✅ Progress saved');
        }
    } catch (error) {
        showAlert('Failed to save progress');
    }
}

function loadOnboardingProgress() {
    // Try to load the most recent onboarding
    const keys = Object.keys(localStorage).filter(k => k.startsWith('onboarding_'));
    if (keys.length === 0) return;
    
    try {
        const latestKey = keys[keys.length - 1];
        const data = JSON.parse(localStorage.getItem(latestKey));
        
        if (data) {
            onboardingState = data;
            
            // Populate form
            document.getElementById('onboardingEmployeeName').value = data.employeeName || '';
            document.getElementById('onboardingPosition').value = data.position || '';
            document.getElementById('onboardingEmploymentType').value = data.employmentType || '';
            document.getElementById('onboardingStartDate').value = data.startDate || '';
            
            if (data.checklist && data.checklist.length > 0) {
                renderChecklist();
                document.getElementById('checklistProgressBar').classList.remove('hidden');
                updateProgress();
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Previous progress loaded', 'success');
                }
            }
        }
    } catch (error) {
    }
}

// Export to PDF
// ========================================
// ENHANCED CONTRACT GENERATION WITH ONBOARDING PROMPT
// ========================================

// Updated generateEmploymentContract function with onboarding prompt
// Prompt user to create onboarding checklist
function promptForOnboardingChecklist() {
    // Create modal HTML
    const modalHTML = `
        <div id="onboardingPromptModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); text-align: center; animation: fadeIn 0.3s;">
                <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                <h2 style="color: white; font-size: 28px; font-weight: 700; margin: 0 0 15px 0;">Contract Generated!</h2>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 18px; margin-bottom: 30px; line-height: 1.6;">
                    Would you like to create an <strong>AI-Enhanced Onboarding Checklist</strong> for this employee?
                </p>
                
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: left;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 10px;">
                        <strong style="color: white;">We'll automatically pre-fill:</strong>
                    </div>
                    <div style="display: grid; gap: 8px; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                        <div>✓ Employee name</div>
                        <div>✓ Position/role</div>
                        <div>✓ Employment type</div>
                        <div>✓ Start date</div>
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 15px; margin-bottom: 30px;">
                    <div style="color: #ffd700; font-weight: 600; font-size: 15px; margin-bottom: 8px;">⭐ Recommended</div>
                    <div style="color: rgba(255, 255, 255, 0.9); font-size: 13px; line-height: 1.5;">
                        Ensure nothing is forgotten during onboarding with our smart checklist that adapts to the employee's role
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="createOnboardingFromContract()" style="flex: 1; padding: 16px 32px; background: #ffc107; color: #000; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 193, 7, 0.4)'">
                        ✨ Yes, Create Checklist
                    </button>
                    <button onclick="closeOnboardingPrompt()" style="padding: 16px 32px; background: rgba(255, 255, 255, 0.2); color: white; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        Skip
                    </button>
                </div>
                
                <div style="margin-top: 20px; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                    You can always create a checklist later from the New Employee Toolkit
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Create onboarding checklist with pre-filled data from contract
function createOnboardingFromContract() {
    // Close the prompt modal first
    closeOnboardingPrompt();
    
    // Close the contract builder
    closeEmploymentContract();
    
    // Extract data from contract builder
    const contractData = contractBuilderState.data.step1;
    
    // Pre-fill onboarding state
    onboardingState.employeeName = contractData.positionTitle ? `New ${contractData.positionTitle}` : 'New Employee';
    onboardingState.position = contractData.positionTitle || '';
    onboardingState.employmentType = contractData.employmentType || '';
    onboardingState.startDate = contractData.startDate || '';
    
    // Open onboarding checklist
    setTimeout(() => {
        openOnboardingChecklist();
        
        // Pre-fill the form after modal is open
        setTimeout(() => {
            const nameField = document.getElementById('onboardingEmployeeName');
            const positionField = document.getElementById('onboardingPosition');
            const typeField = document.getElementById('onboardingEmploymentType');
            const dateField = document.getElementById('onboardingStartDate');
            
            if (nameField) nameField.value = onboardingState.employeeName;
            if (positionField) positionField.value = onboardingState.position;
            if (typeField) typeField.value = onboardingState.employmentType;
            if (dateField) dateField.value = onboardingState.startDate;
            
            // Auto-generate the checklist after a moment
            setTimeout(() => {
                generateSmartChecklist();
            }, 500);
        }, 300);
    }, 300);
}

function closeOnboardingPrompt() {
    const modal = document.getElementById('onboardingPromptModal');
    if (modal) {
        modal.remove();
    } else {
    }
}


// ========================================
// AI-ENHANCED TRAINING PLAN GENERATOR
// ========================================

let trainingPlanState = {
    employeeName: '',
    position: '',
    experience: '',
    duration: 0,
    focusAreas: '',
    plan: null,
    planId: null
};

// Main Functions
function openTrainingPlan() {
    const modal = document.getElementById('trainingPlanModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    loadTrainingProgress();
    
    trackToolUsage('trainingPlanGenerator');
}

function closeTrainingPlan() {
    const modal = document.getElementById('trainingPlanModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Generate Training Plan
async function generateTrainingPlan() {
    const employeeName = document.getElementById('trainingEmployeeName').value.trim();
    const position = document.getElementById('trainingPosition').value.trim();
    const experience = document.getElementById('trainingExperience').value;
    const duration = document.getElementById('trainingDuration').value;
    const focusAreas = document.getElementById('trainingFocusAreas').value.trim();
    
    // Validation
    if (!employeeName || !position || !experience || !duration) {
        showAlert('Please fill in all required fields');
        return;
    }
    
    // Save to state
    trainingPlanState = {
        employeeName,
        position,
        experience,
        duration: parseInt(duration),
        focusAreas,
        planId: 'training_' + Date.now(),
        plan: null
    };
    
    // Show loading
    showTrainingAIThinking();
    
    try {
        // Get AI insights
        const insights = await getTrainingAIInsights();
        displayTrainingInsights(insights);
        
        // Generate the plan
        const plan = buildTrainingPlan();
        trainingPlanState.plan = plan;
        
        // Display the plan
        displayTrainingPlan(plan);
        
        // Apply blur overlay (user must unlock to download)
        // Hide actions until unlocked
        applyUniversalBlur('trainingPlanDisplay', 'trainingPlan', 'Training Plan', 'trainingActions');
        
        // Show coach section (free to use)
        document.getElementById('trainingCoachSection').classList.remove('hidden');
        
    } catch (error) {
        showAlert('Failed to generate training plan. Please try again.');
    }
}

function showTrainingAIThinking() {
    const insightsBox = document.getElementById('trainingAIInsights');
    const content = document.getElementById('trainingAIContent');
    
    content.innerHTML = '<div class="ai-thinking-training"><span class="fitz-thinking-wrap"><span class="fitz-bot fitz-sm fitz-float" style="vertical-align: middle;"></span> <span class="fitz-thinking-dots"><span></span><span></span><span></span></span> Analysing role requirements and generating personalised training plan</span></div>';
    insightsBox.classList.remove('hidden');
}

// Get AI Insights
async function getTrainingAIInsights() {
    const positionName = document.getElementById('trainingPosition').value.trim();
    const prompt = `As an Australian hospitality training expert, provide 3 key insights for training a ${trainingPlanState.experience} ${positionName} over ${trainingPlanState.duration} weeks. ${trainingPlanState.focusAreas ? 'Focus areas: ' + trainingPlanState.focusAreas : ''}

Provide:
1. Critical skills to prioritise
2. Common training challenges for this role
3. Success indicators

Be specific to Australian hospitality and practical.`;
    
    try {
        const response = await callClaudeAPI(prompt);
        return response;
    } catch (error) {
        return getFallbackInsights();
    }
}

function getFallbackInsights() {
    const positionName = document.getElementById('trainingPosition').value.trim();
    return `For ${trainingPlanState.experience} ${positionName}:

• Start with compliance and safety - WHS, food safety (if applicable), RSA (if applicable)
• Focus on hands-on practice rather than theory - hospitality is learned by doing
• Build confidence gradually - start with supervision, progress to independence
• Key success indicator: Can perform core duties independently by end of training`;
}

function displayTrainingInsights(insights) {
    const content = document.getElementById('trainingAIContent');
    content.innerHTML = insights.replace(/\n/g, '<br>');
}

// Build Training Plan
function buildTrainingPlan() {
    const weeks = trainingPlanState.duration;
    const position = trainingPlanState.position;
    const experience = trainingPlanState.experience;
    
    const plan = {
        weeks: []
    };
    
    // Generate week-by-week plan
    for (let weekNum = 1; weekNum <= weeks; weekNum++) {
        plan.weeks.push(generateWeek(weekNum, weeks, position, experience));
    }
    
    return plan;
}

function generateWeek(weekNum, totalWeeks, position, experience) {
    const isFirstWeek = weekNum === 1;
    const isLastWeek = weekNum === totalWeeks;
    
    const week = {
        number: weekNum,
        title: getWeekTitle(weekNum, totalWeeks),
        days: []
    };
    
    // Generate 5 days per week (Mon-Fri)
    for (let dayNum = 1; dayNum <= 5; dayNum++) {
        week.days.push(generateDay(dayNum, weekNum, totalWeeks, position, experience));
    }
    
    return week;
}

function getWeekTitle(weekNum, totalWeeks) {
    if (weekNum === 1) return 'Induction & Foundations';
    if (weekNum === totalWeeks) return 'Mastery & Assessment';
    if (weekNum === 2) return 'Core Skills Development';
    if (weekNum <= totalWeeks / 2) return 'Skill Building';
    return 'Advanced Training';
}

function generateDay(dayNum, weekNum, totalWeeks, position, experience) {
    const globalDay = (weekNum - 1) * 5 + dayNum;
    const isFirstDay = globalDay === 1;
    const isLastDay = globalDay === (totalWeeks * 5);
    
    const day = {
        number: dayNum,
        title: getDayTitle(dayNum, weekNum, globalDay, isFirstDay, isLastDay),
        activities: []
    };
    
    // Add activities based on day and role
    day.activities = generateActivities(dayNum, weekNum, globalDay, position, experience, isFirstDay, isLastDay, totalWeeks);
    
    return day;
}

function getDayTitle(dayNum, weekNum, globalDay, isFirstDay, isLastDay) {
    if (isFirstDay) return 'Welcome & Induction';
    if (isLastDay) return 'Final Assessment';
    if (weekNum === 1 && dayNum === 5) return 'Week 1 Review';
    if (weekNum > 1 && dayNum === 1) return 'Week Goals & Planning';
    if (dayNum === 5) return 'Weekly Review';
    
    const titles = {
        2: 'Foundational Training',
        3: 'Practical Application',
        4: 'Skill Development'
    };
    
    return titles[dayNum] || 'Training Day';
}

function generateActivities(dayNum, weekNum, globalDay, position, experience, isFirstDay, isLastDay, totalWeeks) {
    const activities = [];
    
    // First day - induction
    if (isFirstDay) {
        activities.push(
            { type: 'theory', title: 'Welcome & Paperwork', description: 'Complete all onboarding paperwork, tax forms, super choice', duration: '1 hour' },
            { type: 'theory', title: 'WHS & Safety Training', description: 'Workplace health & safety, emergency procedures, safe work practices', duration: '1.5 hours' },
            { type: 'shadowing', title: 'Venue Tour', description: 'Complete tour of venue, meet the team, understand layout', duration: '45 mins' },
            { type: 'theory', title: 'Role Overview', description: 'Understand position responsibilities, expectations, standards', duration: '1 hour' }
        );
        return activities;
    }
    
    // Last day - final assessment
    if (isLastDay) {
        activities.push(
            { type: 'practical', title: 'Practical Skills Demonstration', description: 'Demonstrate all key competencies learned during training', duration: '2 hours' },
            { type: 'assessment', title: 'Knowledge Assessment', description: 'Written or verbal assessment of role knowledge', duration: '30 mins' },
            { type: 'assessment', title: 'Performance Review', description: 'Final feedback session, discuss strengths and areas for growth', duration: '45 mins' },
            { type: 'assessment', title: 'Training Completion', description: 'Sign off training, receive certification, plan ongoing development', duration: '45 mins' }
        );
        return activities;
    }
    
    // Role-specific activities
    if (position.includes('chef') || position.includes('kitchen')) {
        activities.push(...getKitchenActivities(dayNum, weekNum, globalDay, experience, totalWeeks));
    } else if (position.includes('waiter') || position.includes('host') || position.includes('supervisor')) {
        activities.push(...getFrontOfHouseActivities(dayNum, weekNum, globalDay, experience, totalWeeks));
    } else if (position.includes('bartender') || position.includes('barista')) {
        activities.push(...getBarActivities(dayNum, weekNum, globalDay, experience, position, totalWeeks));
    } else if (position === 'restaurant-manager') {
        activities.push(...getManagerActivities(dayNum, weekNum, globalDay, experience, totalWeeks));
    } else {
        activities.push(...getGeneralActivities(dayNum, weekNum, globalDay, experience, totalWeeks));
    }
    
    return activities;
}

function getKitchenActivities(dayNum, weekNum, globalDay, experience, totalWeeks) {
    if (weekNum === 1) {
        return [
            { type: 'theory', title: 'Food Safety Certification', description: 'Complete food handler certificate, understand HACCP principles', duration: '2 hours' },
            { type: 'shadowing', title: 'Kitchen Operations', description: 'Shadow experienced chef, observe mise en place and service', duration: '3 hours' },
            { type: 'practical', title: 'Basic Prep Work', description: 'Practice knife skills, basic prep techniques with supervision', duration: '2 hours' }
        ];
    }
    
    if (weekNum === 2 || (totalWeeks >= 4 && weekNum <= 3)) {
        return [
            { type: 'practical', title: 'Station Training', description: 'Work specific station (grill, fry, garde manger, etc) with supervision', duration: '3 hours' },
            { type: 'practical', title: 'Service Practice', description: 'Participate in service, build speed and consistency', duration: '3 hours' },
            { type: 'theory', title: 'Menu Knowledge', description: 'Learn all menu items, ingredients, allergens, cooking methods', duration: '1 hour' }
        ];
    }
    
    return [
        { type: 'practical', title: 'Independent Station Work', description: 'Run station independently during service with minimal supervision', duration: '4 hours' },
        { type: 'practical', title: 'Quality Control', description: 'Maintain presentation and taste standards, plate dishes correctly', duration: '2 hours' },
        { type: 'assessment', title: 'Skills Check', description: 'Supervisor assesses speed, quality, and consistency', duration: '1 hour' }
    ];
}

function getFrontOfHouseActivities(dayNum, weekNum, globalDay, experience, totalWeeks) {
    if (weekNum === 1) {
        return [
            { type: 'theory', title: 'Customer Service Standards', description: 'Learn service standards, greeting guests, handling requests', duration: '1.5 hours' },
            { type: 'theory', title: 'POS System Training', description: 'Learn point of sale system, order entry, payments, table management', duration: '2 hours' },
            { type: 'shadowing', title: 'Service Shadowing', description: 'Shadow experienced waiter, observe full service cycle', duration: '3 hours' },
            { type: 'theory', title: 'Menu & Beverage Knowledge', description: 'Study menu items, wine list, cocktails, dietary requirements', duration: '1.5 hours' }
        ];
    }
    
    if (weekNum === 2 || (totalWeeks >= 4 && weekNum <= 3)) {
        return [
            { type: 'practical', title: 'Taking Orders', description: 'Practice taking orders, making recommendations, upselling', duration: '2 hours' },
            { type: 'practical', title: 'Service Practice', description: 'Serve tables with supervision, manage small section', duration: '3 hours' },
            { type: 'theory', title: 'Difficult Situations', description: 'Learn to handle complaints, special requests, challenging customers', duration: '1 hour' }
        ];
    }
    
    return [
        { type: 'practical', title: 'Full Section Service', description: 'Manage full section independently during service', duration: '4 hours' },
        { type: 'practical', title: 'Wine Service', description: 'Practice wine service, presentation, handling special occasions', duration: '1.5 hours' },
        { type: 'assessment', title: 'Service Quality Check', description: 'Manager observes and provides feedback on service quality', duration: '30 mins' }
    ];
}

function getBarActivities(dayNum, weekNum, globalDay, experience, position, totalWeeks) {
    const isBarista = position.includes('barista');
    
    if (weekNum === 1) {
        return [
            { type: 'theory', title: isBarista ? 'Coffee Knowledge' : 'RSA Certification', description: isBarista ? 'Learn coffee types, extraction, milk texturing basics' : 'Complete Responsible Service of Alcohol certification', duration: '2 hours' },
            { type: 'shadowing', title: isBarista ? 'Machine Operation' : 'Bar Operations', description: isBarista ? 'Shadow barista, observe machine use, workflow, cleaning' : 'Shadow bartender, observe service flow, drink preparation', duration: '3 hours' },
            { type: 'practical', title: 'Basic Preparation', description: isBarista ? 'Practice espresso shots, milk steaming with supervision' : 'Learn basic drinks, garnishes, glassware', duration: '2 hours' }
        ];
    }
    
    if (weekNum === 2 || (totalWeeks >= 4 && weekNum <= 3)) {
        return [
            { type: 'practical', title: 'Drink Preparation', description: isBarista ? 'Make all coffee styles, practice latte art' : 'Prepare full range of cocktails and mixed drinks', duration: '3 hours' },
            { type: 'practical', title: 'Customer Service', description: 'Serve customers, take orders, process payments', duration: '2 hours' },
            { type: 'practical', title: 'Speed & Consistency', description: 'Build speed while maintaining quality standards', duration: '2 hours' }
        ];
    }
    
    return [
        { type: 'practical', title: 'Independent Service', description: 'Work independently during busy periods', duration: '4 hours' },
        { type: 'practical', title: isBarista ? 'Advanced Techniques' : 'Inventory Management', description: isBarista ? 'Advanced latte art, alternative brewing methods' : 'Stock control, ordering, wastage reduction', duration: '2 hours' },
        { type: 'assessment', title: 'Skills Assessment', description: 'Demonstrate speed, quality, and customer service skills', duration: '1 hour' }
    ];
}

function getManagerActivities(dayNum, weekNum, globalDay, experience, totalWeeks) {
    if (weekNum === 1) {
        return [
            { type: 'theory', title: 'Operations Overview', description: 'Understand all business operations, systems, procedures', duration: '2 hours' },
            { type: 'shadowing', title: 'Management Shadowing', description: 'Shadow current manager through full shift cycle', duration: '4 hours' },
            { type: 'theory', title: 'Team & Roster', description: 'Learn team structure, roster system, staff management', duration: '1.5 hours' }
        ];
    }
    
    if (weekNum === 2 || (totalWeeks >= 4 && weekNum <= 3)) {
        return [
            { type: 'practical', title: 'Floor Management', description: 'Manage floor during service with support', duration: '3 hours' },
            { type: 'theory', title: 'Financials & Reporting', description: 'Learn POS reports, daily takings, cost control basics', duration: '2 hours' },
            { type: 'practical', title: 'Staff Coordination', description: 'Brief staff, delegate tasks, problem-solve issues', duration: '2 hours' }
        ];
    }
    
    return [
        { type: 'practical', title: 'Independent Management', description: 'Manage shift independently, make decisions, handle escalations', duration: '4 hours' },
        { type: 'practical', title: 'Performance Management', description: 'Provide staff feedback, conduct reviews, training', duration: '2 hours' },
        { type: 'assessment', title: 'Management Review', description: 'Senior manager assesses decision-making and leadership', duration: '1 hour' }
    ];
}

function getGeneralActivities(dayNum, weekNum, globalDay, experience, totalWeeks) {
    if (weekNum === 1) {
        return [
            { type: 'theory', title: 'Role Training', description: 'Learn specific role duties, procedures, and standards', duration: '2 hours' },
            { type: 'shadowing', title: 'Job Shadowing', description: 'Shadow experienced team member, observe best practices', duration: '3 hours' },
            { type: 'practical', title: 'Basic Tasks', description: 'Practice core tasks with supervision and guidance', duration: '2 hours' }
        ];
    }
    
    return [
        { type: 'practical', title: 'Supervised Work', description: 'Perform role duties with supervision and support', duration: '4 hours' },
        { type: 'practical', title: 'Skill Building', description: 'Focus on efficiency, quality, and consistency', duration: '2 hours' },
        { type: 'assessment', title: 'Progress Check', description: 'Review progress, provide feedback, address questions', duration: '1 hour' }
    ];
}

// Display Training Plan
function displayTrainingPlan(plan) {
    const container = document.getElementById('trainingPlanDisplay');
    
    let html = '';
    
    plan.weeks.forEach(week => {
        html += `
            <div class="training-week">
                <h3 class="text-xl font-bold text-white mb-4">Week ${week.number}: ${week.title}</h3>
        `;
        
        week.days.forEach(day => {
            html += `
                <div class="training-day">
                    <div class="text-lg font-semibold text-amber-500 mb-3">Day ${day.number}: ${day.title}</div>
                    <div class="space-y-2">
            `;
            
            day.activities.forEach(activity => {
                const iconClass = `icon-${activity.type}`;
                const icon = {
                    'theory': '📚',
                    'practical': '🔧',
                    'assessment': '✅',
                    'shadowing': '👥'
                }[activity.type] || '📋';
                
                html += `
                    <div class="training-activity">
                        <div class="activity-icon ${iconClass}">${icon}</div>
                        <div class="activity-content">
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-description">${activity.description}</div>
                            <div class="activity-duration">⏱️ ${activity.duration}</div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
    container.classList.remove('hidden');
}

// AI Training Coach
async function askTrainingCoach() {
    const question = document.getElementById('trainingCoachInput').value.trim();
    
    if (!question) {
        showAlert('Please enter a question');
        return;
    }
    
    const responseBox = document.getElementById('trainingCoachResponse');
    const responseContent = document.getElementById('trainingCoachContent');
    
    responseBox.classList.remove('hidden');
    responseContent.innerHTML = '<div class="ai-thinking-training"><span class="fitz-thinking-wrap"><span class="fitz-bot fitz-sm fitz-float" style="vertical-align: middle;"></span> <span class="fitz-thinking-dots"><span></span><span></span><span></span></span> Thinking</span></div>';
    
    try {
        const positionName = document.getElementById('trainingPosition').value.trim();
        const context = `Training plan for ${trainingPlanState.experience} ${positionName} over ${trainingPlanState.duration} weeks`;
        const prompt = `As an Australian hospitality training expert, answer this question:\n\nContext: ${context}\n\nQuestion: ${question}\n\nProvide practical, specific advice.`;
        
        const answer = await callClaudeAPI(prompt);
        responseContent.innerHTML = answer.replace(/\n/g, '<br>');
        
        document.getElementById('trainingCoachInput').value = '';
    } catch (error) {
        responseContent.innerHTML = 'Sorry, I encountered an error. Please try again.';
    }
}

// Save/Load Functions
function saveTrainingPlan() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    
    try {
        localStorage.setItem('training_plan_' + trainingPlanState.planId, JSON.stringify(trainingPlanState));
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Training plan saved', 'success');
        } else {
            showAlert('✅ Training plan saved');
        }
    } catch (error) {
        showAlert('Failed to save training plan');
    }
}

function loadTrainingProgress() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('training_plan_'));
    if (keys.length === 0) return;
    
    try {
        const latestKey = keys[keys.length - 1];
        const data = JSON.parse(localStorage.getItem(latestKey));
        
        if (data) {
            trainingPlanState = data;
            
            // Populate form
            if (data.employeeName) document.getElementById('trainingEmployeeName').value = data.employeeName;
            if (data.position) document.getElementById('trainingPosition').value = data.position;
            if (data.experience) document.getElementById('trainingExperience').value = data.experience;
            if (data.duration) document.getElementById('trainingDuration').value = data.duration.toString();
            if (data.focusAreas) document.getElementById('trainingFocusAreas').value = data.focusAreas;
            
            if (data.plan) {
                displayTrainingPlan(data.plan);
                document.getElementById('trainingActions').classList.remove('hidden');
                document.getElementById('trainingCoachSection').classList.remove('hidden');
            }
        }
    } catch (error) {
    }
}

// Export Functions
function exportTrainingPlanDOCXUnlocked() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    
    try {
        const html = buildTrainingPlanHTML();
        const converted = htmlDocx.asBlob(html);
        const positionName = document.getElementById('trainingPosition').value.trim().replace(/\s+/g, '_');
        const filename = `Training_Plan_${positionName}_${Date.now()}.docx`;
        
        saveAs(converted, filename);
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Training plan downloaded as DOCX', 'success');
        }
    } catch (error) {
        showAlert('Failed to generate DOCX. Please try again.');
    }
}

function exportTrainingPlanPDFUnlocked() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    
    try {
        const docDefinition = buildTrainingPlanPDFDefinition();
        const positionName = document.getElementById('trainingPosition').value.trim().replace(/\s+/g, '_');
        const filename = `Training_Plan_${positionName}_${Date.now()}.pdf`;
        
        pdfMake.createPdf(docDefinition).download(filename);
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Training plan downloaded as PDF', 'success');
        }
    } catch (error) {
        showAlert('Failed to generate PDF. Please try again.');
    }
}

// Protected versions that require credit payment
function exportTrainingPlanDOCX() {
    protectedExportTrainingPlanDOCX();
}

function exportTrainingPlanPDF() {
    protectedExportTrainingPlanPDF();
}

function printTrainingPlan() {
    if (!trainingPlanState.plan) {
        showAlert('Please generate a training plan first');
        return;
    }
    
    window.print();
}

// Build HTML for DOCX export
function buildTrainingPlanHTML() {
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    const positionName = document.getElementById('trainingPosition').value.trim();
    const plan = trainingPlanState.plan;
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #000; }
                h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; margin-bottom: 20px; }
                h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #bdc3c7; padding-bottom: 5px; }
                h3 { color: #667eea; margin-top: 20px; }
                .info-box { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
                .info-box p { margin: 5px 0; }
                .week { margin: 30px 0; page-break-inside: avoid; }
                .day { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa; }
                .activity { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #95a5a6; }
                .activity-title { font-weight: bold; color: #2c3e50; }
                .activity-description { color: #555; margin: 5px 0; }
                .activity-duration { color: #f39c12; font-size: 14px; font-weight: 600; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #bdc3c7; text-align: center; color: #7f8c8d; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>Training Plan: ${positionName}</h1>
            
            <div class="info-box">
                <p><strong>Employee Name:</strong> ${trainingPlanState.employeeName}</p>
                <p><strong>Position:</strong> ${positionName}</p>
                <p><strong>Experience Level:</strong> ${trainingPlanState.experience}</p>
                <p><strong>Training Duration:</strong> ${trainingPlanState.duration} weeks</p>
                ${trainingPlanState.focusAreas ? `<p><strong>Focus Areas:</strong> ${trainingPlanState.focusAreas}</p>` : ''}
            </div>
    `;
    
    plan.weeks.forEach(week => {
        html += `
            <div class="week">
                <h2>Week ${week.number}: ${week.title}</h2>
        `;
        
        week.days.forEach(day => {
            html += `
                <div class="day">
                    <h3>Day ${day.number}: ${day.title}</h3>
            `;
            
            day.activities.forEach(activity => {
                html += `
                    <div class="activity">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-duration">Duration: ${activity.duration}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        });
        
        html += `</div>`;
    });
    
    html += `
            <div class="footer">
                <p>Generated by Fitz HR on ${today}</p>
                <p>This training plan provides a structured approach to employee development</p>
            </div>
        </body>
        </html>
    `;
    
    return html;
}

// Build PDF definition
function buildTrainingPlanPDFDefinition() {
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    const positionName = document.getElementById('trainingPosition').value.trim();
    const plan = trainingPlanState.plan;
    
    const content = [
        { text: `Training Plan: ${positionName}`, style: 'header', margin: [0, 0, 0, 20] },
        
        {
            table: {
                widths: ['30%', '70%'],
                body: [
                    ['Employee Name:', trainingPlanState.employeeName],
                    ['Position:', positionName],
                    ['Experience Level:', trainingPlanState.experience],
                    ['Training Duration:', `${trainingPlanState.duration} weeks`]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
        }
    ];
    
    plan.weeks.forEach(week => {
        content.push({ text: `Week ${week.number}: ${week.title}`, style: 'weekHeader', margin: [0, 15, 0, 10], pageBreak: week.number > 1 ? 'before' : '' });
        
        week.days.forEach(day => {
            content.push({ text: `Day ${day.number}: ${day.title}`, style: 'dayTitle', margin: [0, 10, 0, 5] });
            
            day.activities.forEach(activity => {
                content.push({
                    stack: [
                        { text: activity.title, style: 'activityTitle' },
                        { text: activity.description, style: 'activityDescription' },
                        { text: `Duration: ${activity.duration}`, style: 'activityDuration' }
                    ],
                    margin: [10, 5, 0, 10]
                });
            });
        });
    });
    
    content.push({
        text: `Generated by Fitz HR on ${today}`,
        style: 'footer',
        margin: [0, 30, 0, 0]
    });
    
    return {
        content: content,
        styles: {
            header: { fontSize: 24, bold: true, color: '#2c3e50' },
            weekHeader: { fontSize: 16, bold: true, color: '#34495e' },
            dayTitle: { fontSize: 14, bold: true, color: '#667eea' },
            activityTitle: { fontSize: 12, bold: true },
            activityDescription: { fontSize: 10, color: '#555' },
            activityDuration: { fontSize: 10, color: '#f39c12', italics: true },
            footer: { fontSize: 10, color: '#95a5a6', alignment: 'center' }
        },
        defaultStyle: { font: 'Helvetica' }
    };
}


// ========================================
// PROBATION CHECK-IN BUILDER
// ========================================

let probationCheckInState = {
    currentStep: 1,
    totalSteps: 6,
    data: {},
    generatedDocument: null,
    isGenerating: false
};

const probationWizardSteps = [
    // Step 1: Procedural Fairness
    {
        id: 1,
        title: "Procedural Fairness & Meeting Preparation",
        infoBox: {
            type: 'info',
            icon: '⚖️',
            title: 'Why Procedural Fairness Matters',
            content: `<p class="mb-2">A probation check-in is a <strong>supportive conversation</strong> designed to help new employees succeed. To ensure fairness and transparency:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>The employee should know in advance this meeting is happening and its purpose</li>
                <li>They should be given the opportunity to prepare their own reflections</li>
                <li>The conversation must be two-way — the employee's perspective matters</li>
                <li>Any concerns raised must be specific, factual and supported by examples</li>
                <li>The employee must be offered support and a clear path to improvement</li>
                <li>Both the employee and leader retain a copy of the completed document</li>
            </ul>
            <p class="mt-2 text-amber-400 font-semibold text-sm">This is NOT a disciplinary meeting. It is a development and support conversation.</p>`
        },
        fields: [
            {
                name: "noticeGiven",
                label: "Has the employee been given reasonable notice of this probation check-in meeting (at least 24 hours)?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            },
            {
                name: "purposeExplained",
                label: "Has the employee been told the purpose of the meeting (i.e., a probation review to discuss progress, not a disciplinary meeting)?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            },
            {
                name: "supportPersonAdvised",
                label: "Has the employee been advised they may bring a support person if they wish?",
                type: "radio",
                options: ["Yes", "No"],
                required: true
            }
        ]
    },
    // Step 2: Employee & Probation Details
    {
        id: 2,
        title: "Employee & Probation Details",
        fields: [
            { name: "employeeName", label: "Employee's full name", type: "text", required: false, placeholder: "e.g., Sarah Johnson" },
            { name: "position", label: "Position/Role", type: "text", required: true, placeholder: "e.g., Bartender" },
            { name: "employmentType", label: "Employment Type", type: "select",
              options: ["Full-Time", "Part-Time", "Casual"], required: true },
            { name: "startDate", label: "Employment start date", type: "date", required: true },
            { name: "probationEndDate", label: "Probation end date", type: "date", required: true },
            { name: "checkInNumber", label: "Which probation check-in is this?", type: "select",
              options: ["1st Check-In (Month 1)", "2nd Check-In (Month 2)", "3rd Check-In (Month 3)", "4th Check-In (Month 4)", "5th Check-In (Month 5)", "Final Check-In (Month 6 / End of Probation)"],
              required: true },
            { name: "managerName", label: "Manager/Supervisor conducting the review", type: "text", required: true, placeholder: "Your name" }
        ]
    },
    // Step 3: Key Requirements Review
    {
        id: 3,
        title: "Key Role Requirements",
        infoBox: {
            type: 'tip',
            icon: '💡',
            title: 'Tip',
            content: '<p>List the core requirements of the role that were communicated at hiring. These should be the fundamental expectations the employee needs to meet to pass probation.</p>'
        },
        fields: [
            { name: "keyRequirements", label: "What are the key requirements of this role? (List 3-5 core requirements)",
              type: "textarea", required: true, rows: 4,
              placeholder: "e.g.,\n• Consistently arrive on time for all rostered shifts\n• Maintain RSA compliance and responsible service practices\n• Complete all opening and closing duties to standard\n• Work effectively as part of the team\n• Follow all food safety and WHS procedures" },
            { name: "requirementsRating", label: "Overall, how is the employee tracking against these requirements?", type: "select",
              options: ["Exceeding expectations", "Meeting expectations", "Partially meeting expectations", "Not meeting expectations"],
              required: true },
            { name: "requirementsComments", label: "Specific comments on requirements (provide examples where possible)",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g., Sarah has been punctual for all shifts except two occasions in week 3. She has completed RSA training and follows service standards well." }
        ]
    },
    // Step 4: Deliverables & Behaviours
    {
        id: 4,
        title: "Role Deliverables & Behaviours",
        infoBox: {
            type: 'tip',
            icon: '💡',
            title: 'Tip',
            content: '<p>Deliverables are the tangible outputs expected. Behaviours relate to how the employee conducts themselves — teamwork, communication, attitude, professionalism. Be specific and use examples.</p>'
        },
        fields: [
            { name: "deliverables", label: "Key deliverables — what the employee should be producing/achieving at this stage",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\n• Independently manage a section of 6 tables\n• Accurately process orders through POS system\n• Upsell menu items to achieve average spend targets" },
            { name: "deliverablesRating", label: "How is the employee tracking on deliverables?", type: "select",
              options: ["Exceeding expectations", "Meeting expectations", "Partially meeting expectations", "Not meeting expectations"],
              required: true },
            { name: "behaviours", label: "Behavioural expectations — how the employee is expected to conduct themselves",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\n• Positive and professional attitude with guests and team\n• Takes initiative and asks questions when unsure\n• Communicates effectively during service\n• Accepts feedback constructively" },
            { name: "behavioursRating", label: "How is the employee tracking on behaviours?", type: "select",
              options: ["Exceeding expectations", "Meeting expectations", "Partially meeting expectations", "Not meeting expectations"],
              required: true },
            { name: "deliverablesAndBehavioursComments", label: "Specific examples and comments on deliverables and behaviours",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g., Sarah's guest interactions are excellent — she's received two positive customer comments. She could improve on communication with kitchen during busy service." }
        ]
    },
    // Step 5: Support & Development
    {
        id: 5,
        title: "Support & Development",
        infoBox: {
            type: 'info',
            icon: '🤝',
            title: 'Support is Key',
            content: '<p>Probation is a two-way street. The employee must be given genuine support, training, and regular feedback. Document what has been provided and what additional support is needed.</p>'
        },
        fields: [
            { name: "trainingProvided", label: "What training and support has been provided so far?",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\n• 3-day induction program completed\n• Buddy assigned (James - Senior Bartender)\n• RSA training completed\n• POS system training completed\n• Menu knowledge sessions x2" },
            { name: "additionalTrainingNeeded", label: "What additional training or support does the employee need?",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\n• Cocktail masterclass for premium drinks\n• Advanced POS functions (split bills, modifications)\n• Cellar and wine knowledge training" },
            { name: "oneOnOneFrequency", label: "How often are you having one-on-one check-ins?", type: "select",
              options: ["Weekly", "Fortnightly", "Monthly", "Ad hoc / as needed", "Not currently scheduled"],
              required: true },
            { name: "oneOnOneComments", label: "Comments on one-on-one meetings and feedback provided",
              type: "textarea", required: false, rows: 2,
              placeholder: "e.g., Weekly 15-min catch-ups on Mondays before shift. Employee is receptive to feedback." },
            { name: "employeeFeedback", label: "Has the employee raised any concerns, questions, or feedback?",
              type: "textarea", required: false, rows: 2,
              placeholder: "e.g., Sarah mentioned she'd like more exposure to cocktail making. No concerns raised about the role or team." }
        ]
    },
    // Step 6: Overall Assessment & Next Steps
    {
        id: 6,
        title: "Overall Assessment & Next Steps",
        fields: [
            { name: "overallAssessment", label: "Overall probation assessment at this stage", type: "select",
              options: [
                "On track — progressing well, no concerns",
                "On track with minor areas for development",
                "At risk — some concerns that need to be addressed",
                "Significant concerns — improvement plan required",
                "Final check-in: Recommend confirming employment",
                "Final check-in: Recommend extending probation",
                "Final check-in: Recommend ending employment"
              ],
              required: true },
            { name: "areasOfStrength", label: "Key areas of strength to acknowledge",
              type: "textarea", required: true, rows: 2,
              placeholder: "e.g., Excellent customer interactions, strong work ethic, reliable attendance" },
            { name: "areasForImprovement", label: "Areas for improvement (if any) — be specific",
              type: "textarea", required: false, rows: 2,
              placeholder: "e.g., Needs to improve speed of service during peak periods, could be more proactive in asking for tasks during quiet periods" },
            { name: "agreedActions", label: "Agreed actions for the next period (for both employee AND leader)",
              type: "textarea", required: true, rows: 3,
              placeholder: "e.g.,\nEmployee:\n• Focus on speed of service during Friday/Saturday peaks\n• Complete cocktail training by end of month\n\nLeader:\n• Arrange cocktail masterclass with Head Bartender\n• Continue weekly check-ins\n• Provide real-time feedback during busy shifts" },
            { name: "nextCheckInDate", label: "Next probation check-in date", type: "date", required: true },
            { name: "additionalNotes", label: "Any additional notes or comments",
              type: "textarea", required: false, rows: 2 }
        ]
    }
];

// ========================================
// PROBATION CHECK-IN - CORE FUNCTIONS
// ========================================

function openProbationCheckIn() {
    const modal = document.getElementById('probationCheckInModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    // Reset state
    probationCheckInState.currentStep = 1;
    probationCheckInState.data = {};
    probationCheckInState.generatedDocument = null;
    probationCheckInState.isGenerating = false;
    
    // Show wizard, hide generating
    document.getElementById('probationGenerating').classList.add('hidden');
    document.getElementById('probationStepContent').classList.remove('hidden');
    document.getElementById('probationProgressSection').classList.remove('hidden');
    document.getElementById('probationNextBtn').classList.remove('hidden');
    document.getElementById('probationBackBtn').style.display = 'none';
    
    showProbationStep(1);
    
    trackToolUsage('probationCheckIn');
}

function closeProbationCheckIn() {
    const modal = document.getElementById('probationCheckInModal');
    if (modal) modal.classList.add('hidden');
}

function closeProbationPreview() {
    document.getElementById('probationPreviewModal').classList.add('hidden');
}

function resetProbationCheckIn() {
    if (!confirm('Start over? This will clear all your entered information.')) return;
    probationCheckInState.currentStep = 1;
    probationCheckInState.data = {};
    probationCheckInState.generatedDocument = null;
    
    document.getElementById('probationGenerating').classList.add('hidden');
    document.getElementById('probationStepContent').classList.remove('hidden');
    document.getElementById('probationProgressSection').classList.remove('hidden');
    document.getElementById('probationNextBtn').classList.remove('hidden');
    
    showProbationStep(1);
}

// ========================================
// PROBATION CHECK-IN - STEP RENDERING
// ========================================

function showProbationStep(stepNumber) {
    const step = probationWizardSteps[stepNumber - 1];
    if (!step) return;
    
    probationCheckInState.currentStep = stepNumber;
    
    // Update progress
    document.getElementById('probationCurrentStep').textContent = stepNumber;
    document.getElementById('probationTotalSteps').textContent = probationCheckInState.totalSteps;
    const progress = Math.round((stepNumber / probationCheckInState.totalSteps) * 100);
    document.getElementById('probationProgress').textContent = `${progress}% Complete`;
    document.getElementById('probationProgressBar').style.width = `${progress}%`;
    
    // Build step HTML
    let html = `<h3 class="text-xl font-bold text-white mb-4">${step.title}</h3>`;
    
    // Add info box if present
    if (step.infoBox) {
        const bgColor = step.infoBox.type === 'info' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30';
        const textColor = step.infoBox.type === 'info' ? 'text-blue-300' : 'text-amber-300';
        html += `
            <div class="${bgColor} border rounded-lg p-4 mb-6">
                <p class="${textColor} font-semibold mb-2 flex items-center gap-2">
                    <span>${step.infoBox.icon}</span> ${step.infoBox.title}
                </p>
                <div class="${textColor} text-sm">${step.infoBox.content}</div>
            </div>
        `;
    }
    
    html += '<div class="space-y-4">';
    
    step.fields.forEach(field => {
        html += '<div>';
        const isProbEmployeeName = field.name === 'employeeName';
        const probInfoIcon = isProbEmployeeName ? ' <span class="fitz-info-icon" onclick="fitzInfoToggle(this)">ⓘ</span>' : '';
        html += `<label class="block text-slate-300 text-sm mb-2">
                    ${field.label}${field.required ? ' <span class="text-red-400">*</span>' : ''}${probInfoIcon}
                 </label>`;
        if (isProbEmployeeName) {
            html += '<div class="fitz-info-box">Fitz HR processes workplace data entered by users to generate HR documents. You must have authority to input employee information.</div>';
        }
        
        const savedValue = probationCheckInState.data[field.name] || '';
        
        if (field.type === 'text') {
            html += `<input type="text" id="prob_${field.name}" 
                           placeholder="${field.placeholder || ''}"
                           value="${savedValue}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'textarea') {
            html += `<textarea id="prob_${field.name}" rows="${field.rows || 3}"
                              placeholder="${field.placeholder || ''}"
                              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                              ${field.required ? 'required' : ''}>${savedValue}</textarea>`;
        } else if (field.type === 'select') {
            html += `<select id="prob_${field.name}" 
                            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                            ${field.required ? 'required' : ''}>
                        <option value="">Select...</option>`;
            field.options.forEach(opt => {
                const selected = savedValue === opt ? 'selected' : '';
                html += `<option value="${opt}" ${selected}>${opt}</option>`;
            });
            html += '</select>';
        } else if (field.type === 'radio') {
            field.options.forEach(opt => {
                const checked = savedValue === opt ? 'checked' : '';
                html += `<label class="flex items-center gap-2 text-slate-300 mb-2 cursor-pointer">
                            <input type="radio" name="prob_${field.name}" value="${opt}" ${checked}
                                   class="text-amber-500 focus:ring-amber-500">
                            <span>${opt}</span>
                         </label>`;
            });
        } else if (field.type === 'date') {
            const today = new Date().toISOString().split('T')[0];
            html += `<input type="date" id="prob_${field.name}" 
                           value="${savedValue || today}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                           ${field.required ? 'required' : ''}>`;
        } else if (field.type === 'number') {
            html += `<input type="number" id="prob_${field.name}" 
                           min="${field.min || 0}" max="${field.max || 100}"
                           placeholder="${field.placeholder || ''}"
                           value="${savedValue}"
                           class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                           ${field.required ? 'required' : ''}>`;
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    
    document.getElementById('probationStepContent').innerHTML = html;
    
    // Show/hide back button
    document.getElementById('probationBackBtn').style.display = stepNumber > 1 ? 'block' : 'none';
    
    // Show/hide start over button
    const startOverBtn = document.getElementById('probationStartOverBtn');
    if (startOverBtn) {
        startOverBtn.classList.toggle('hidden', stepNumber <= 1);
    }
    
    // Update next button text
    const nextBtn = document.getElementById('probationNextBtn');
    if (stepNumber === probationCheckInState.totalSteps) {
        nextBtn.innerHTML = '✨ Generate Document';
    } else {
        nextBtn.innerHTML = 'Next Step →';
    }
}

// ========================================
// PROBATION CHECK-IN - NAVIGATION & VALIDATION
// ========================================

function probationWizardNext() {
    const step = probationWizardSteps[probationCheckInState.currentStep - 1];
    let allValid = true;
    
    // Save field values
    step.fields.forEach(field => {
        let value;
        if (field.type === 'radio') {
            const radio = document.querySelector(`input[name="prob_${field.name}"]:checked`);
            value = radio ? radio.value : '';
        } else {
            const element = document.getElementById(`prob_${field.name}`);
            value = element ? element.value.trim() : '';
        }
        
        if (field.required && !value) {
            allValid = false;
        }
        
        probationCheckInState.data[field.name] = value;
    });
    
    if (!allValid) {
        showAlert('⚠️ Please complete all required fields before continuing.');
        return;
    }
    
    // Procedural fairness validation on Step 1
    if (probationCheckInState.currentStep === 1) {
        if (!validateProbationProceduralFairness()) {
            return;
        }
    }
    
    // Move to next step or generate
    if (probationCheckInState.currentStep < probationCheckInState.totalSteps) {
        probationCheckInState.currentStep++;
        showProbationStep(probationCheckInState.currentStep);
    } else {
        generateProbationCheckInDocument();
    }
}

function probationWizardBack() {
    if (probationCheckInState.currentStep > 1) {
        // Save current step data first
        const step = probationWizardSteps[probationCheckInState.currentStep - 1];
        step.fields.forEach(field => {
            let value;
            if (field.type === 'radio') {
                const radio = document.querySelector(`input[name="prob_${field.name}"]:checked`);
                value = radio ? radio.value : '';
            } else {
                const element = document.getElementById(`prob_${field.name}`);
                value = element ? element.value.trim() : '';
            }
            probationCheckInState.data[field.name] = value;
        });
        
        probationCheckInState.currentStep--;
        showProbationStep(probationCheckInState.currentStep);
    }
}

function validateProbationProceduralFairness() {
    const data = probationCheckInState.data;
    
    if (data.noticeGiven === 'No') {
        showAlert(
            '⚠️ REASONABLE NOTICE REQUIRED\n\n' +
            'The employee should be given at least 24 hours notice of this probation check-in meeting.\n\n' +
            'This allows them to:\n' +
            '• Prepare their own reflections on their progress\n' +
            '• Think about any questions or concerns they have\n' +
            '• Arrange a support person if they wish\n\n' +
            'Please schedule the meeting for at least 24 hours from now.'
        );
        probationCheckInState.data.noticeGiven = '';
        showProbationStep(1);
        return false;
    }
    
    if (data.purposeExplained === 'No') {
        showAlert(
            '⚠️ PURPOSE MUST BE COMMUNICATED\n\n' +
            'The employee must understand this is a supportive probation review meeting — NOT a disciplinary meeting.\n\n' +
            'Please inform the employee that the purpose is to:\n' +
            '• Review their progress during probation\n' +
            '• Discuss what\'s going well and any areas for development\n' +
            '• Agree on support and next steps\n\n' +
            'Please communicate this to the employee before continuing.'
        );
        probationCheckInState.data.purposeExplained = '';
        showProbationStep(1);
        return false;
    }
    
    if (data.supportPersonAdvised === 'No') {
        showAlert(
            '⚠️ SUPPORT PERSON OPTION\n\n' +
            'While a probation check-in is supportive in nature, best practice is to advise the employee they may bring a support person if they wish.\n\n' +
            'A support person can be:\n' +
            '• A colleague\n' +
            '• A family member or friend\n' +
            '• A union representative\n\n' +
            'Please advise the employee of this option before continuing.'
        );
        probationCheckInState.data.supportPersonAdvised = '';
        showProbationStep(1);
        return false;
    }
    
    return true;
}

// ========================================
// PROBATION CHECK-IN - AI GENERATION
// ========================================

async function generateProbationCheckInDocument() {
    // Hide wizard, show loading
    document.getElementById('probationStepContent').classList.add('hidden');
    document.getElementById('probationProgressSection').classList.add('hidden');
    document.getElementById('probationNextBtn').classList.add('hidden');
    document.getElementById('probationBackBtn').style.display = 'none';
    document.getElementById('probationStartOverBtn').classList.add('hidden');
    document.getElementById('probationGenerating').classList.remove('hidden');
    
    probationCheckInState.isGenerating = true;
    
    try {
        const prompt = buildProbationCheckInPrompt();
        const response = await callClaudeAPI(prompt);
        
        probationCheckInState.generatedDocument = response;
        
        // Close builder modal
        closeProbationCheckIn();
        
        // Show preview
        showProbationPreview(response);
        
        if (typeof trackEvent === 'function') {
            trackEvent('probation_checkin_generated', {
                user: currentUser,
                employeeName: probationCheckInState.data.employeeName,
                checkInNumber: probationCheckInState.data.checkInNumber
            });
        }
        
    } catch (error) {
        showAlert('⚠️ Error generating document. Please try again.');
        
        // Reset to wizard
        document.getElementById('probationGenerating').classList.add('hidden');
        document.getElementById('probationStepContent').classList.remove('hidden');
        document.getElementById('probationProgressSection').classList.remove('hidden');
        document.getElementById('probationNextBtn').classList.remove('hidden');
        showProbationStep(probationCheckInState.currentStep);
    } finally {
        probationCheckInState.isGenerating = false;
    }
}

function buildProbationCheckInPrompt() {
    const data = probationCheckInState.data;
    
    const venueContext = (typeof venueProfile !== 'undefined' && venueProfile.setupComplete) ?
        `Venue: ${venueProfile.venueName} (${venueProfile.venueType}) in ${venueProfile.city}, ${venueProfile.location}` :
        'Australian hospitality venue';
    
    const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return `You are generating a PROBATION CHECK-IN DOCUMENT for Australian hospitality HR.

This is a supportive probation review document — NOT a disciplinary document. The purpose is to support a new employee during their probation period by reviewing progress, identifying development needs, and agreeing on support.

VENUE CONTEXT:
${venueContext}
Award: Hospitality Industry (General) Award MA000009
Manager/Reviewer: ${data.managerName || '[Manager Name]'}

EMPLOYEE DETAILS:
- Name: ${data.employeeName}
- Position: ${data.position}
- Employment Type: ${data.employmentType}
- Start Date: ${data.startDate}
- Probation End Date: ${data.probationEndDate}
- Check-In: ${data.checkInNumber}

PROCEDURAL FAIRNESS:
- Reasonable notice given: ${data.noticeGiven}
- Purpose explained: ${data.purposeExplained}
- Support person option advised: ${data.supportPersonAdvised}

KEY ROLE REQUIREMENTS:
${data.keyRequirements}

Requirements Rating: ${data.requirementsRating}
Manager Comments on Requirements: ${data.requirementsComments}

ROLE DELIVERABLES:
${data.deliverables}
Deliverables Rating: ${data.deliverablesRating}

BEHAVIOURAL EXPECTATIONS:
${data.behaviours}
Behaviours Rating: ${data.behavioursRating}

Manager Comments on Deliverables & Behaviours: ${data.deliverablesAndBehavioursComments}

SUPPORT & DEVELOPMENT:
Training Provided: ${data.trainingProvided}
Additional Training Needed: ${data.additionalTrainingNeeded}
One-on-One Frequency: ${data.oneOnOneFrequency}
${data.oneOnOneComments ? `One-on-One Comments: ${data.oneOnOneComments}` : ''}
${data.employeeFeedback ? `Employee Feedback/Concerns: ${data.employeeFeedback}` : ''}

OVERALL ASSESSMENT:
Assessment: ${data.overallAssessment}
Areas of Strength: ${data.areasOfStrength}
${data.areasForImprovement ? `Areas for Improvement: ${data.areasForImprovement}` : 'No specific areas for improvement noted.'}
Agreed Actions: ${data.agreedActions}
Next Check-In Date: ${data.nextCheckInDate}
${data.additionalNotes ? `Additional Notes: ${data.additionalNotes}` : ''}

**CRITICAL FORMATTING REQUIREMENTS:**
1. Use ## for major sections (e.g., ## EMPLOYEE DETAILS)
2. Use blank lines between ALL paragraphs and sections
3. Use **text** for emphasis sparingly
4. For lists, use bullet points with "• " prefix
5. Structure clearly with proper spacing
6. Separate each major section with a blank line before and after
7. ALWAYS add a space after colons in labels

Generate a complete, professional Probation Check-In document with the following structure:

# PROBATION CHECK-IN RECORD

## DOCUMENT DETAILS

Date of Review: ${today}
Check-In: ${data.checkInNumber}
Reviewer: ${data.managerName}

## EMPLOYEE DETAILS

Full Name: ${data.employeeName}
Position: ${data.position}
Employment Type: ${data.employmentType}
Start Date: ${data.startDate}
Probation End Date: ${data.probationEndDate}

## PROCEDURAL FAIRNESS CONFIRMATION

Confirm each of the following were completed:
• Employee given reasonable notice of this meeting: ${data.noticeGiven}
• Employee informed of the meeting purpose (supportive probation review): ${data.purposeExplained}
• Employee advised they may bring a support person: ${data.supportPersonAdvised}

## KEY ROLE REQUIREMENTS REVIEW

Take the key requirements provided and present each one as a row/item with the manager's assessment. Expand the manager's comments into a professional, specific narrative. Include the overall rating.

## ROLE DELIVERABLES & BEHAVIOURS

Split into two sub-sections:

### Deliverables
Take the deliverables provided and expand into a professional assessment with specific examples.

### Behaviours
Take the behavioural expectations provided and expand into a professional assessment with specific examples.

Include both ratings.

## SUPPORT & DEVELOPMENT

### Training & Support Provided
List training that has been provided.

### Additional Training & Support Required
List what is still needed and when it should be completed.

### One-on-One Meetings & Feedback
Document the current one-on-one meeting schedule, quality of feedback, and any comments.

### Employee Feedback
Document any concerns, questions or feedback the employee has raised. If none, note that the employee was given the opportunity and had no concerns.

## OVERALL ASSESSMENT

Provide a professional narrative summary that:
1. Acknowledges strengths with specific examples
2. Addresses any areas for improvement constructively with specific, actionable guidance
3. Sets clear expectations for the next period
4. Is supportive and development-focused in tone

Overall Probation Status: ${data.overallAssessment}

## AGREED ACTIONS

Split into:

### Employee Actions
List specific, measurable actions for the employee.

### Leader/Manager Actions
List specific support actions the manager commits to providing.

### Timeline
Next check-in date and any milestone dates.

## EMPLOYEE COMMENTS

*Space for the employee to add their own comments, reflections, or feedback during or after the meeting:*

__________________________________________________________________________________
__________________________________________________________________________________
__________________________________________________________________________________

## ACKNOWLEDGEMENT & SIGNATURES

This document records the discussion held on ${today} as part of the probation review process. Both parties acknowledge:

• This check-in has been conducted fairly and the employee was given the opportunity to respond
• The agreed actions have been discussed and understood by both parties
• Both the employee and the manager/leader will retain a copy of this document for their records
• This document is a supportive development record and does not constitute disciplinary action

Employee Signature: _________________________________ Date: ______________

Employee Name (Print): ${data.employeeName}

Manager Signature: _________________________________ Date: ______________

Manager Name (Print): ${data.managerName}

## DOCUMENT DISTRIBUTION

☐ Copy provided to employee
☐ Copy retained by manager/leader for employee file

---

**CONFIDENTIAL** — This document contains personal employment information and should be stored securely in accordance with privacy obligations.

IMPORTANT INSTRUCTIONS:
- Expand the brief manager comments into professional, specific narratives while staying factual
- Use a supportive, development-focused tone throughout — this is NOT a disciplinary document
- Be specific and constructive in all feedback areas
- Ensure the document reads as a complete, standalone record of the probation check-in
- DO NOT add fictional details — only expand and contextualise what was provided
- Make sure the document acknowledges the employee's strengths first before any areas for improvement
- The overall tone should make the employee feel supported and clear about expectations`;
}

// ========================================
// PROBATION CHECK-IN - PREVIEW & DOWNLOAD
// ========================================

function showProbationPreview(generatedDoc) {
    // Use existing convertAIContentToHTML if available
    const formattedHTML = (typeof convertAIContentToHTML === 'function') ?
        convertAIContentToHTML(generatedDoc) : generatedDoc.replace(/\n/g, '<br>');
    
    document.getElementById('probationPreviewContent').innerHTML = formattedHTML;
    document.getElementById('probationPreviewModal').classList.remove('hidden');
    
    // Apply blur overlay (user must unlock to download)
    setTimeout(() => {
        applyUniversalBlur('probationPreviewContent', 'probationCheckIn', 'Probation Check-In', 'probationActionsContainer');
    }, 100);
}

// Protected download (requires credit payment)
async function downloadProbationDocument(format = 'pdf') {
    requireCreditForDownload('probationCheckIn', 'Probation Check-In', (fmt) => {
        downloadProbationDocumentUnlocked(fmt || format);
    }, format);
}

// Unlocked download (called after credit payment)
async function downloadProbationDocumentUnlocked(format = 'pdf') {
    const userAccepts = confirm(
        "📄 PROBATION CHECK-IN DOCUMENT\n\n" +
        "Before finalising this document, please ensure:\n\n" +
        "✓ All factual details are accurate\n" +
        "✓ The employee has had the opportunity to add their comments\n" +
        "✓ Both parties sign the document\n" +
        "✓ A copy is provided to the employee\n" +
        "✓ A copy is retained by the manager for the employee file\n\n" +
        "Click OK to download, or Cancel to return."
    );
    
    if (!userAccepts) return;
    
    try {
        const employeeName = probationCheckInState.data.employeeName || 'Employee';
        const checkIn = probationCheckInState.data.checkInNumber || 'Check-In';
        const checkInShort = checkIn.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        const filename = `Probation_CheckIn_${employeeName.replace(/\s+/g, '_')}_${checkInShort}_${new Date().toISOString().slice(0,10)}`;
        
        const previewElement = document.getElementById('probationPreviewContent');
        if (!previewElement) {
            throw new Error('Preview content not found');
        }
        
        const formattedHTML = previewElement.innerHTML;
        
        if (format === 'pdf') {
            // Use existing PDF generation
            if (typeof convertHTMLToPdfMake === 'function' && typeof pdfMake !== 'undefined') {
                const metadata = {
                    title: `Probation Check-In - ${employeeName}`,
                    documentType: 'Probation Check-In',
                    generatedBy: 'Fitz HR Assistant'
                };
                const docDefinition = convertHTMLToPdfMake(formattedHTML, metadata);
                pdfMake.createPdf(docDefinition).download(`${filename}.pdf`);
            } else {
                // Fallback: print to PDF
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html><head><title>${filename}</title>
                    <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;line-height:1.6}
                    h1{color:#1a1a2e;border-bottom:3px solid #f59e0b;padding-bottom:10px}
                    h2{color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-top:25px}
                    h3{color:#4a5568;margin-top:15px}</style>
                    </head><body>${formattedHTML}</body></html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        } else {
            // Word document
            if (typeof generateWordDocument === 'function') {
                await generateWordDocument(formattedHTML, `${filename}.docx`);
            } else if (typeof htmlDocx !== 'undefined') {
                const fullHTML = `
                    <html><head><style>
                    body{font-family:Arial,sans-serif;color:#333;line-height:1.6}
                    h1{color:#1a1a2e;border-bottom:3px solid #f59e0b;padding-bottom:10px;font-size:24px}
                    h2{color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-top:20px;font-size:18px}
                    h3{color:#4a5568;margin-top:15px;font-size:16px}
                    p{margin:8px 0}
                    </style></head><body>${formattedHTML}</body></html>
                `;
                const blob = htmlDocx.asBlob(fullHTML);
                saveAs(blob, `${filename}.docx`);
            } else {
                showAlert('Word document generation is not available. Please try PDF instead.');
            }
        }
        
        if (typeof trackEvent === 'function') {
            trackEvent('probation_checkin_downloaded', {
                user: currentUser,
                format: format,
                employeeName: employeeName,
                checkIn: checkIn
            });
        }
        
        // Show reminder toast
        if (typeof showToast === 'function') {
            showToast('📄 Remember: Provide a copy to the employee and retain one for your records.', 'info', 5000);
        }
        
    } catch (error) {
        showAlert('⚠️ Error downloading document. Please try again.');
    }
}


// ========================================
// ENHANCED CHECKLIST EXPORT FUNCTIONS
// ========================================

// Export to DOCX (protected by credit system)
function exportChecklistDOCX() {
    protectedExportChecklistDOCX();
}

// Export to PDF (protected by credit system)
function exportChecklistPDF() {
    protectedExportChecklistPDF();
}

// Unlocked export to DOCX (called after credit payment)
function exportChecklistDOCXUnlocked() {
    if (!onboardingState.checklist || onboardingState.checklist.length === 0) {
        showAlert('Please generate a checklist first');
        return;
    }
    
    try {
        const html = buildChecklistHTML();
        const converted = htmlDocx.asBlob(html);
        const filename = `Onboarding_Checklist_${onboardingState.position.replace(/\s+/g, '_')}_${Date.now()}.docx`;
        
        saveAs(converted, filename);
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Checklist downloaded as DOCX', 'success');
        }
    } catch (error) {
        showAlert('Failed to generate DOCX. Please try again.');
    }
}

// Unlocked export to PDF (called after credit payment)
function exportChecklistPDFUnlocked() {
    if (!onboardingState.checklist || onboardingState.checklist.length === 0) {
        showAlert('Please generate a checklist first');
        return;
    }
    
    try {
        const element = document.createElement('div');
        element.innerHTML = buildChecklistHTML();
        element.style.backgroundColor = 'white';
        element.style.padding = '40px';
        
        const filename = `Onboarding_Checklist_${onboardingState.position.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        
        // Use pdfMake which is already loaded
        const docDefinition = buildChecklistPDFDefinition();
        
        pdfMake.createPdf(docDefinition).download(filename);
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Checklist downloaded as PDF', 'success');
        }
    } catch (error) {
        showAlert('Failed to generate PDF. Please try again.');
    }
}

// Build PDF definition using pdfMake
function buildChecklistPDFDefinition() {
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Group by category
    const grouped = onboardingState.checklist.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
    
    const content = [
        { text: 'Onboarding Checklist', style: 'header', margin: [0, 0, 0, 20] },
        
        // Employee Info
        {
            table: {
                widths: ['30%', '70%'],
                body: [
                    ['Employee Name:', onboardingState.employeeName],
                    ['Position:', onboardingState.position],
                    ['Employment Type:', onboardingState.employmentType],
                    ['Start Date:', new Date(onboardingState.startDate).toLocaleDateString('en-AU')]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
        },
        
        // Progress
        {
            text: `Progress: ${onboardingState.completedTasks.length} of ${onboardingState.checklist.length} tasks completed (${Math.round((onboardingState.completedTasks.length / onboardingState.checklist.length) * 100)}%)`,
            style: 'subheader',
            margin: [0, 0, 0, 20]
        }
    ];
    
    // Add categories
    Object.keys(grouped).forEach(category => {
        content.push({ text: category, style: 'category', margin: [0, 20, 0, 10] });
        
        grouped[category].forEach(item => {
            const isCompleted = onboardingState.completedTasks.includes(item.id);
            
            content.push({
                stack: [
                    {
                        columns: [
                            { text: isCompleted ? '☑' : '☐', width: 20 },
                            { 
                                stack: [
                                    { text: item.title, style: 'taskTitle', decoration: isCompleted ? 'lineThrough' : '' },
                                    { text: item.hint, style: 'taskHint' },
                                    item.daysUntil !== undefined ? 
                                        { text: `Due: ${item.daysUntil === 0 ? 'Today' : item.daysUntil === 1 ? 'Tomorrow' : `In ${item.daysUntil} days`}`, style: 'taskDue' } : {}
                                ]
                            },
                            { text: item.priority.toUpperCase(), style: `priority${item.priority}`, width: 60 }
                        ]
                    }
                ],
                margin: [0, 5, 0, 10]
            });
        });
    });
    
    // Footer
    content.push({
        text: `Generated by Fitz HR on ${today}`,
        style: 'footer',
        margin: [0, 30, 0, 0]
    });
    
    return {
        content: content,
        styles: {
            header: { fontSize: 24, bold: true, color: '#2c3e50' },
            subheader: { fontSize: 14, bold: true, color: '#34495e' },
            category: { fontSize: 16, bold: true, color: '#667eea', margin: [0, 15, 0, 5] },
            taskTitle: { fontSize: 12, bold: true },
            taskHint: { fontSize: 10, color: '#7f8c8d', margin: [0, 3, 0, 0] },
            taskDue: { fontSize: 9, color: '#95a5a6', italics: true, margin: [0, 2, 0, 0] },
            priorityhigh: { fontSize: 9, bold: true, color: 'white', fillColor: '#e74c3c', alignment: 'center' },
            prioritymedium: { fontSize: 9, bold: true, color: 'white', fillColor: '#f39c12', alignment: 'center' },
            prioritylow: { fontSize: 9, bold: true, color: 'white', fillColor: '#27ae60', alignment: 'center' },
            footer: { fontSize: 10, color: '#95a5a6', alignment: 'center' }
        },
        defaultStyle: { font: 'Helvetica' }
    };
}

// Build HTML for DOCX export
function buildChecklistHTML() {
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Group by category
    const grouped = onboardingState.checklist.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    max-width: 800px; 
                    margin: 40px auto; 
                    padding: 20px;
                    color: #000;
                }
                h1 { 
                    color: #2c3e50; 
                    border-bottom: 3px solid #667eea; 
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                h2 { 
                    color: #34495e; 
                    margin-top: 30px; 
                    border-bottom: 2px solid #bdc3c7; 
                    padding-bottom: 5px;
                }
                .employee-info {
                    background: #ecf0f1;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .employee-info p {
                    margin: 5px 0;
                }
                .progress {
                    background: #ecf0f1;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .category {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .task {
                    margin: 15px 0;
                    padding: 15px;
                    border-left: 4px solid #3498db;
                    background: #f8f9fa;
                    page-break-inside: avoid;
                }
                .task.completed {
                    opacity: 0.6;
                    border-left-color: #27ae60;
                }
                .task-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .task-hint {
                    color: #7f8c8d;
                    font-size: 14px;
                    margin: 5px 0;
                }
                .checkbox {
                    display: inline-block;
                    width: 18px;
                    height: 18px;
                    border: 2px solid #34495e;
                    border-radius: 3px;
                    vertical-align: middle;
                }
                .checkbox.checked {
                    background: #27ae60;
                    border-color: #27ae60;
                    position: relative;
                }
                .checkbox.checked::after {
                    content: "✓";
                    color: white;
                    position: absolute;
                    top: -2px;
                    left: 2px;
                    font-size: 14px;
                    font-weight: bold;
                }
                .priority {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .priority-high {
                    background: #e74c3c;
                    color: white;
                }
                .priority-medium {
                    background: #f39c12;
                    color: white;
                }
                .priority-low {
                    background: #27ae60;
                    color: white;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #bdc3c7;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <h1>Onboarding Checklist</h1>
            
            <div class="employee-info">
                <p><strong>Employee Name:</strong> ${onboardingState.employeeName}</p>
                <p><strong>Position:</strong> ${onboardingState.position}</p>
                <p><strong>Employment Type:</strong> ${onboardingState.employmentType}</p>
                <p><strong>Start Date:</strong> ${new Date(onboardingState.startDate).toLocaleDateString('en-AU')}</p>
            </div>
            
            <div class="progress">
                <p><strong>Progress:</strong> ${onboardingState.completedTasks.length} of ${onboardingState.checklist.length} tasks completed (${Math.round((onboardingState.completedTasks.length / onboardingState.checklist.length) * 100)}%)</p>
            </div>
    `;
    
    // Add each category
    Object.keys(grouped).forEach(category => {
        html += `
            <div class="category">
                <h2>${getCategoryIcon(category)} ${category}</h2>
        `;
        
        grouped[category].forEach(item => {
            const isCompleted = onboardingState.completedTasks.includes(item.id);
            html += `
                <div class="task ${isCompleted ? 'completed' : ''}">
                    <div class="task-title">
                        <span class="checkbox ${isCompleted ? 'checked' : ''}"></span>
                        <span>${item.title}</span>
                        <span class="priority priority-${item.priority}">${item.priority}</span>
                    </div>
                    <div class="task-hint">${item.hint}</div>
                    ${item.daysUntil !== undefined ? `
                        <div class="task-hint">
                            <strong>Due:</strong> ${item.daysUntil === 0 ? 'Today' : item.daysUntil === 1 ? 'Tomorrow' : `In ${item.daysUntil} days`}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += `
            <div class="footer">
                <p>Generated by Fitz HR on ${today}</p>
                <p>This checklist helps ensure compliant and thorough employee onboarding</p>
            </div>
        </body>
        </html>
    `;
    
    return html;
}



function openEmploymentContractBuilder() {
    const builder = document.getElementById('employmentContractBuilder');
    if (builder) {
        builder.classList.add('active');
    }
    
    if (!contractBuilderState.contractId) {
        contractBuilderState.contractId = 'contract_' + Date.now();
    }
    
    loadContractProgress();
    renderContractStep(contractBuilderState.currentStep);
    
    trackToolUsage('employmentContractBuilder');
}


// EMPLOYMENT CONTRACT BUILDER JAVASCRIPT  
// ========================================

// Contract Builder State Management
const contractBuilderState = {
    currentStep: 0,
    totalSteps: 9,
    contractId: null,
    userId: null,
    data: {
        step0: { businessState: '', knowMyAward: false, understandTemplate: false, detailedTermsAccepted: false, detailedTermsAcceptedAt: null, timestamp: null },
        step1: { positionTitle: '', dutiesOption: 'attach', duties: '', awardName: '', businessStructure: '', workplaceAddress: '', employmentType: '', isPermanent: true, startDate: '', endDate: '', hasProbation: false, probationLength: '6' },
        step2: { 
            hoursPerWeek: '', 
            isShiftworker: 'no',
            flexibleHours: false,
            averagingHours: false,
            onCallStandby: false,
            includeRostersClause: false,
            rosterNoticeDays: '7',
            rosterChangeDays: '7',
            employeeRosterNoticeDays: '7',
            workPattern: '', 
            overtimeApplies: true, 
            shiftWork: false 
        },
        step3: { 
            payRateType: 'hourly',
            payRate: '', 
            payFrequency: 'weekly', 
            payMethod: 'bank', 
            superannuation: true,
            additionalSuper: false,
            additionalSuperPercent: '',
            penaltyRatesOvertime: false,
            allowances: false,
            commission: false,
            commissionArrangement: '',
            annualBonus: false,
            annualPayReview: false
        },
        step4: { 
            annualLeaveMeasure: 'weeks',
            annualLeaveAmount: '4',
            additionalParentalLeave: false,
            additionalParentalLeaveWeeks: ''
        },
        step5: { employeeObligations: true, conflictOfInterest: false, confidentiality: false, intellectualProperty: false, consultation: false, disputes: true },
        step6: { 
            resignationNotice: { 
                year1: '1', 
                year1to3: '2', 
                year3to5: '3', 
                year5plus: '4' 
            }, 
            misconductClause: false 
        },
        step7: { reviewComplete: false },
        step8: { deliveryMethod: 'download' }
    },
    unsavedChanges: false,
    lastSaved: null
};

// Main Functions
function openEmploymentContract() {
    const builder = document.getElementById('employmentContractBuilder');
    builder.classList.add('active');
    
    if (!contractBuilderState.contractId) {
        contractBuilderState.contractId = 'contract_' + Date.now();
    }
    
    loadContractProgress();
    renderContractStep(contractBuilderState.currentStep);
    
    trackToolUsage('employmentContractBuilder');
}

function closeEmploymentContract() {
    if (contractBuilderState.unsavedChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
            return;
        }
    }
    
    const builder = document.getElementById('employmentContractBuilder');
    builder.classList.remove('active');
}

// Navigation Functions
function nextContractStep() {
    try {
        if (!validateContractStep(contractBuilderState.currentStep)) {
            return;
        }
        
        saveCurrentStepData();
        contractBuilderState.unsavedChanges = true;
        
        // ✅ CHECK: If moving from Step 0 (Setup) to Step 1 (Position Details)
        // Show detailed Terms of Use modal if not already accepted
        if (contractBuilderState.currentStep === 0 && !contractBuilderState.data.step0.detailedTermsAccepted) {
            showContractBuilderTermsModal();
            return; // Don't proceed until terms are accepted
        }
        
        if (contractBuilderState.currentStep < contractBuilderState.totalSteps - 1) {
            contractBuilderState.currentStep++;
            renderContractStep(contractBuilderState.currentStep);
            updateContractProgressBar();
        }
    } catch (error) {
        showAlert('An error occurred: ' + error.message);
    }
}

/**
 * Show the Contract Builder Terms of Use modal
 */
function showContractBuilderTermsModal() {
    const modal = document.getElementById('contractBuilderTermsModal');
    const checkbox = document.getElementById('contractTermsCheckbox');
    const acceptBtn = document.getElementById('acceptContractTermsBtn');
    
    if (modal) {
        modal.classList.remove('hidden');
        // Reset checkbox state
        if (checkbox) checkbox.checked = false;
        if (acceptBtn) acceptBtn.disabled = true;
        
        // Enable accept button only when checkbox is checked
        if (checkbox) {
            checkbox.onchange = function() {
                if (acceptBtn) acceptBtn.disabled = !this.checked;
            };
        }
        
        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('contract_builder_terms_shown', { 
                user: currentUser?.uid || currentUser 
            });
        }
    } else {
    }
}

/**
 * User accepts the Contract Builder Terms of Use
 */
function acceptContractTerms() {
    const checkbox = document.getElementById('contractTermsCheckbox');
    
    if (!checkbox || !checkbox.checked) {
        showAlert('⚠️ Please check the box to confirm you have read and agree to the Terms of Use.');
        return;
    }
    
    // Save acceptance to contract builder state
    contractBuilderState.data.step0.detailedTermsAccepted = true;
    contractBuilderState.data.step0.detailedTermsAcceptedAt = new Date().toISOString();
    
    // Close modal
    const modal = document.getElementById('contractBuilderTermsModal');
    if (modal) modal.classList.add('hidden');
    
    // Track acceptance
    if (typeof trackEvent === 'function') {
        trackEvent('contract_builder_terms_accepted', { 
            user: currentUser?.uid || currentUser,
            timestamp: contractBuilderState.data.step0.detailedTermsAcceptedAt
        });
    }
    
    // Show toast
    if (typeof showToast === 'function') {
        showToast('Terms accepted - proceeding to Position Details', 'success', 2000);
    }
    
    // Now proceed to next step
    contractBuilderState.currentStep++;
    renderContractStep(contractBuilderState.currentStep);
    updateContractProgressBar();
}

/**
 * User declines the Contract Builder Terms of Use
 */
function declineContractTerms() {
    const modal = document.getElementById('contractBuilderTermsModal');
    if (modal) modal.classList.add('hidden');
    
    // Track decline
    if (typeof trackEvent === 'function') {
        trackEvent('contract_builder_terms_declined', { 
            user: currentUser?.uid || currentUser 
        });
    }
    
    // Show info toast
    if (typeof showToast === 'function') {
        showToast('You must accept the Terms of Use to create contracts', 'info', 3000);
    }
}

function previousContractStep() {
    if (contractBuilderState.currentStep > 0) {
        saveCurrentStepData();
        contractBuilderState.currentStep--;
        renderContractStep(contractBuilderState.currentStep);
        updateContractProgressBar();
    }
}

function jumpToContractStep(stepNumber) {
    if (stepNumber >= 0 && stepNumber < contractBuilderState.totalSteps) {
        saveCurrentStepData();
        contractBuilderState.currentStep = stepNumber;
        renderContractStep(stepNumber);
        updateContractProgressBar();
    }
}

// Validation Popup Functions
function showValidationPopup(errors) {
    const popup = document.getElementById('contractValidationPopup');
    const errorList = document.getElementById('validationErrorList');
    
    if (popup && errorList) {
        // Build error list HTML
        errorList.innerHTML = errors.map(error => `
            <div style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #dc2626; font-weight: bold;">•</span>
                <span style="color: #991b1b;">${error}</span>
            </div>
        `).join('');
        
        popup.classList.remove('hidden');
    }
}

function closeValidationPopup() {
    const popup = document.getElementById('contractValidationPopup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

// Validation Function
function validateContractStep(stepNumber) {
    const stepData = contractBuilderState.data[`step${stepNumber}`];
    const errors = [];
    
    switch(stepNumber) {
        case 0: {
            // Read directly from form elements (state not saved yet)
            const businessState = document.getElementById('businessState')?.value;
            const understandTemplate = document.getElementById('understandTemplate')?.checked;
            
            if (!businessState) {
                errors.push('Business State/Territory is required');
            }
            if (!understandTemplate) {
                errors.push('You must acknowledge that this is a template tool');
            }
            break;
        }
        case 1: {
            // Read directly from form elements (state not saved yet)
            const positionTitle = document.getElementById('positionTitle')?.value;
            const awardName = document.getElementById('awardName')?.value;
            const employmentType = document.querySelector('input[name="employmentType"]:checked')?.value;
            const startDate = document.getElementById('startDate')?.value;
            const isPermanent = document.querySelector('input[name="isPermanent"]:checked')?.value;
            const endDate = document.getElementById('endDate')?.value;
            
            if (!positionTitle) {
                errors.push('Position Title is required');
            }
            if (!awardName) {
                errors.push('Modern Award is required');
            }
            if (!employmentType) {
                errors.push('Employment Type is required');
            }
            if (!startDate) {
                errors.push('Start Date is required');
            }
            if (isPermanent === 'false' && !endDate) {
                errors.push('End Date is required for fixed-term employment');
            }
            break;
        }
        case 2: {
            // Read directly from form elements (state not saved yet)
            const hoursPerWeek = document.getElementById('hoursPerWeek')?.value;
            const step1EmpType = contractBuilderState.data.step1.employmentType;
            const isShiftworker = document.querySelector('input[name="isShiftworker"]:checked')?.value;
            
            // Check step1 employment type from saved state (already saved when we moved to step 2)
            if (!hoursPerWeek && step1EmpType !== 'casual') {
                errors.push('Hours per week is required');
            }
            if (!isShiftworker) {
                errors.push('Shiftworker status is required');
            }
            break;
        }
        case 3: {
            // Read directly from form elements (state not saved yet)
            const payRate = document.getElementById('payRate')?.value;
            const payRateType = document.querySelector('input[name="payRateType"]:checked')?.value;
            const payFrequency = document.querySelector('input[name="payFrequency"]:checked')?.value;
            const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value;
            
            if (!payRateType) {
                errors.push('Pay rate type (hourly/weekly) is required');
            }
            if (!payRate) {
                errors.push('Pay rate amount is required');
            }
            if (!payFrequency) {
                errors.push('Pay frequency is required');
            }
            if (!payMethod) {
                errors.push('Payment method is required');
            }
            break;
        }
        case 4: {
            // Leave step - annual leave amount required for non-casuals
            const step1EmpType = contractBuilderState.data.step1.employmentType;
            const annualLeaveAmount = document.getElementById('annualLeaveAmount')?.value;
            
            if (step1EmpType !== 'casual' && !annualLeaveAmount) {
                errors.push('Annual leave amount is required');
            }
            break;
        }
        case 5: {
            // Additional terms - no required fields, all optional
            break;
        }
        case 6: {
            // Ending employment - check resignation notice fields
            const resignYear1 = document.getElementById('resignYear1')?.value;
            const resignYear1to3 = document.getElementById('resignYear1to3')?.value;
            const resignYear3to5 = document.getElementById('resignYear3to5')?.value;
            const resignYear5plus = document.getElementById('resignYear5plus')?.value;
            
            if (!resignYear1) {
                errors.push('Resignation notice period for 1 year or less is required');
            }
            if (!resignYear1to3) {
                errors.push('Resignation notice period for 1-3 years is required');
            }
            if (!resignYear3to5) {
                errors.push('Resignation notice period for 3-5 years is required');
            }
            if (!resignYear5plus) {
                errors.push('Resignation notice period for 5+ years is required');
            }
            break;
        }
        case 7: {
            const reviewComplete = document.getElementById('reviewComplete')?.checked;
            if (!reviewComplete) {
                errors.push('You must confirm you have reviewed all sections');
            }
            break;
        }
        default:
            break;
    }
    
    if (errors.length > 0) {
        showValidationPopup(errors);
        return false;
    }
    
    return true;
}

// Progress Bar Update
function updateContractProgressBar() {
    const currentStep = contractBuilderState.currentStep;
    const totalSteps = contractBuilderState.totalSteps;
    
    const progressPercent = (currentStep / (totalSteps - 1)) * 100;
    document.getElementById('progressLineFill').style.width = progressPercent + '%';
    
    for (let i = 0; i < totalSteps; i++) {
        const circle = document.getElementById(`progressCircle${i}`);
        const label = circle.parentElement.querySelector('.progress-label');
        
        circle.classList.remove('active', 'completed');
        label.classList.remove('active');
        
        if (i < currentStep) {
            circle.classList.add('completed');
            circle.textContent = '';
        } else if (i === currentStep) {
            circle.classList.add('active');
            label.classList.add('active');
            circle.textContent = i + 1;
        } else {
            circle.textContent = i + 1;
        }
    }
}

// Save/Load Functions
function saveCurrentStepData() {
    const stepNumber = contractBuilderState.currentStep;
    const stepKey = `step${stepNumber}`;
    
    const inputs = document.querySelectorAll(`#contractStepContent input, #contractStepContent select, #contractStepContent textarea`);
    
    inputs.forEach(input => {
        const name = input.name || input.id;
        if (!name) return;
        
        // Special handling for Step 6 resignation notice nested fields
        if (stepNumber === 6 && name.startsWith('resign')) {
            if (!contractBuilderState.data[stepKey].resignationNotice) {
                contractBuilderState.data[stepKey].resignationNotice = {};
            }
            if (name === 'resignYear1') {
                contractBuilderState.data[stepKey].resignationNotice.year1 = input.value;
            } else if (name === 'resignYear1to3') {
                contractBuilderState.data[stepKey].resignationNotice.year1to3 = input.value;
            } else if (name === 'resignYear3to5') {
                contractBuilderState.data[stepKey].resignationNotice.year3to5 = input.value;
            } else if (name === 'resignYear5plus') {
                contractBuilderState.data[stepKey].resignationNotice.year5plus = input.value;
            }
            return;
        }
        
        if (input.type === 'checkbox') {
            contractBuilderState.data[stepKey][name] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) {
                contractBuilderState.data[stepKey][name] = input.value;
            }
        } else {
            contractBuilderState.data[stepKey][name] = input.value;
        }
    });
    
}

async function saveContractProgress() {
    try {
        localStorage.setItem('contract_draft_' + contractBuilderState.contractId, JSON.stringify({
            currentStep: contractBuilderState.currentStep,
            data: contractBuilderState.data,
            lastSaved: new Date().toISOString()
        }));
        
        contractBuilderState.unsavedChanges = false;
        contractBuilderState.lastSaved = new Date();
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Progress saved', 'success');
        }
        
        return true;
    } catch (error) {
        showAlert('Failed to save progress. Please try again.');
        return false;
    }
}

async function loadContractProgress() {
    try {
        const saved = localStorage.getItem('contract_draft_' + contractBuilderState.contractId);
        
        if (saved) {
            const data = JSON.parse(saved);
            contractBuilderState.currentStep = data.currentStep || 0;
            contractBuilderState.data = data.data || contractBuilderState.data;
            contractBuilderState.lastSaved = data.lastSaved ? new Date(data.lastSaved) : null;
            
        }
    } catch (error) {
    }
}

// Helper Functions
function toggleHelpSection(element) {
    const content = element.nextElementSibling;
    element.classList.toggle('expanded');
    content.classList.toggle('expanded');
}

// Auto-save every 30 seconds
setInterval(() => {
    if (contractBuilderState.unsavedChanges && document.getElementById('employmentContractBuilder').classList.contains('active')) {
        saveContractProgress();
    }
}, 30000);


// ========================================
// STEP RENDERING AND TEMPLATES
// ========================================

function renderContractStep(stepNumber) {
    const container = document.getElementById('contractStepContent');
    
    switch(stepNumber) {
        case 0:
            container.innerHTML = getStep0Template();
            initializeStep0Listeners();
            break;
        case 1:
            container.innerHTML = getStep1Template();
            initializeStep1Listeners();
            break;
        case 2:
            container.innerHTML = getStep2Template();
            initializeStep2Listeners();
            break;
        case 3:
            container.innerHTML = getStep3Template();
            initializeStep3Listeners();
            break;
        case 4:
            container.innerHTML = getStep4Template();
            initializeStep4Listeners();
            break;
        case 5:
            container.innerHTML = getStep5Template();
            initializeStep5Listeners();
            break;
        case 6:
            container.innerHTML = getStep6Template();
            initializeStep6Listeners();
            break;
        case 7:
            container.innerHTML = getStep7Template();
            initializeStep7Listeners();
            break;
        case 8:
            container.innerHTML = getStep8Template();
            initializeStep8Listeners();
            break;
    }
    
    // Scroll to top - the employmentContractBuilder div has overflow-y: auto
    const contractBuilder = document.getElementById('employmentContractBuilder');
    if (contractBuilder) {
        contractBuilder.scrollTop = 0;
    }
}

// ========================================
// STEP 0: Before You Begin
// ========================================
// Updated Step 0 Template with validation
function getStep0Template() {
    const data = contractBuilderState.data.step0;
    
    return `
        <h2 class="step-title">Before You Begin</h2>
        <p class="step-description">This tool will take approximately 30 minutes to complete. Let's start with some basic information.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <div class="warning-box">
            <div class="warning-box-title">⚠️ Important Legal Notice</div>
            <div class="warning-box-content">
                <p><strong>This tool provides template contracts only - NOT legal advice.</strong></p>
                <ul>
                    <li>Templates are based on Fair Work Australia requirements</li>
                    <li>You should review with a legal professional before use</li>
                    <li>Fitz HR recommends consulting with our Senior HR Consultant</li>
                    <li>Your specific situation may require additional clauses or modifications</li>
                </ul>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Where is your business located?</label>
            <select class="form-select" id="businessState" name="businessState" onchange="checkStep0Validation()">
                <option value="">Select state/territory...</option>
                <option value="NSW" ${data.businessState === 'NSW' ? 'selected' : ''}>New South Wales</option>
                <option value="VIC" ${data.businessState === 'VIC' ? 'selected' : ''}>Victoria</option>
                <option value="QLD" ${data.businessState === 'QLD' ? 'selected' : ''}>Queensland</option>
                <option value="SA" ${data.businessState === 'SA' ? 'selected' : ''}>South Australia</option>
                <option value="WA" ${data.businessState === 'WA' ? 'selected' : ''}>Western Australia</option>
                <option value="TAS" ${data.businessState === 'TAS' ? 'selected' : ''}>Tasmania</option>
                <option value="NT" ${data.businessState === 'NT' ? 'selected' : ''}>Northern Territory</option>
                <option value="ACT" ${data.businessState === 'ACT' ? 'selected' : ''}>Australian Capital Territory</option>
            </select>
        </div>
        
        <div class="info-box">
            <div class="info-box-title">📚 Know Your Award</div>
            <div class="info-box-content">
                <p>You'll need to know which Modern Award applies to your employee. Not sure?</p>
                <button class="btn btn-link" onclick="openAwardWizardFromContract(); return false;">Use Award Wizard →</button>
                <a href="https://services.fairwork.gov.au/find-my-award" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">Visit Fair Work Award Finder ↗</a>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="knowMyAward" name="knowMyAward" ${data.knowMyAward ? 'checked' : ''} onchange="checkStep0Validation()">
                <span class="checkbox-text">I know which Modern Award applies to this position</span>
            </label>
        </div>
        
        <div class="info-box">
            <div class="info-box-title">📋 Position Description</div>
            <div class="info-box-content">
                <p>Having a clear position description makes creating contracts easier. Need help creating one?</p>
                <button class="btn btn-link" onclick="openPositionDescriptionFromContract(); return false;">Use Position Description Builder →</button>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="understandTemplate" name="understandTemplate" ${data.understandTemplate ? 'checked' : ''} required onchange="checkStep0Validation()">
                <span class="checkbox-text">
                    <strong>I understand this is a template tool and not legal advice.</strong> 
                    I will review any contract with a qualified professional before use. <span style="color: #dc3545; font-weight: bold;">*</span>
                </span>
            </label>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="closeEmploymentContract()">Cancel</button>
            <button class="btn btn-primary" id="step0NextBtn" onclick="nextContractStep()" disabled>
                Next: Position Details →
            </button>
        </div>
    `;
}

function initializeStep0Listeners() {
    // Auto-save on changes
    const inputs = document.querySelectorAll('#contractStepContent input, #contractStepContent select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
    
    // Initial validation check
    checkStep0Validation();
}

// Validation function for Step 0
function checkStep0Validation() {
    const businessState = document.getElementById('businessState')?.value;
    const understandTemplate = document.getElementById('understandTemplate')?.checked;
    const nextBtn = document.getElementById('step0NextBtn');
    
    if (nextBtn) {
        // Enable button only if state is selected AND user acknowledges template nature
        if (businessState && understandTemplate) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
    }
}

// Helper functions to open Award Wizard and Job Description Builder
function openAwardWizardFromContract() {
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ Navigate Away?\n\n' +
        'This will close the Employment Contract Builder and take you to the Award Wizard.\n\n' +
        'Your current progress will be saved, but you will need to return to continue building your contract.\n\n' +
        'Are you sure you want to leave?'
    );
    
    if (!confirmed) {
        return; // User cancelled
    }
    
    // Save current progress before leaving
    saveCurrentStepData();
    saveContractProgress();
    
    // Close contract builder
    closeEmploymentContract();
    
    // Open Award Wizard (using existing function)
    if (typeof openAwardWizard === 'function') {
        openAwardWizard();
    } else {
        showAlert('Award Wizard is not available. Please contact support.');
    }
}

function openPositionDescriptionFromContract() {
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ Navigate Away?\n\n' +
        'This will close the Employment Contract Builder and take you to the Position Description Builder.\n\n' +
        'Your current progress will be saved, but you will need to return to continue building your contract.\n\n' +
        'Are you sure you want to leave?'
    );
    
    if (!confirmed) {
        return; // User cancelled
    }
    
    // Save current progress before leaving
    saveCurrentStepData();
    saveContractProgress();
    
    // Close contract builder
    closeEmploymentContract();
    
    // Open Position Description Builder
    if (typeof openPositionDescriptionBuilder === 'function') {
        openPositionDescriptionBuilder();
    } else {
        showAlert('Position Description Builder is not available. Please contact support.');
    }
}

function openJobDescriptionFromContract() {
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ Navigate Away?\n\n' +
        'This will close the Employment Contract Builder and take you to the Job Advertisement Builder.\n\n' +
        'Your current progress will be saved, but you will need to return to continue building your contract.\n\n' +
        'Are you sure you want to leave?'
    );
    
    if (!confirmed) {
        return; // User cancelled
    }
    
    // Save current progress before leaving
    saveCurrentStepData();
    saveContractProgress();
    
    // Close contract builder
    closeEmploymentContract();
    
    // Open Job Advertisement Builder (using existing function)  
    if (typeof openJobDescriptionBuilder === 'function') {
        openJobDescriptionBuilder();
    } else {
        showAlert('Job Advertisement Builder is not available. Please contact support.');
    }
}

/**
 * Open external link from Contract Builder with confirmation
 */
function openExternalLinkFromContract(url, siteName) {
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ Navigate Away?\n\n' +
        `This will open ${siteName || 'an external website'} in a new tab.\n\n` +
        'Your current progress in the Employment Contract Builder will be preserved.\n\n' +
        'Are you sure you want to open this link?'
    );
    
    if (!confirmed) {
        return false; // User cancelled
    }
    
    // Open in new tab
    window.open(url, '_blank');
    return false; // Prevent default link behavior
}

/**
 * Open Award Calculator from Contract Builder with confirmation
 */
function openAwardCalculatorFromContract() {
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ Navigate Away?\n\n' +
        'This will close the Employment Contract Builder and take you to the Award Calculator.\n\n' +
        'Your current progress will be saved, but you will need to return to continue building your contract.\n\n' +
        'Are you sure you want to leave?'
    );
    
    if (!confirmed) {
        return; // User cancelled
    }
    
    // Save current progress before leaving
    saveCurrentStepData();
    saveContractProgress();
    
    // Close contract builder
    closeEmploymentContract();
    
    // Open Award Calculator (using existing function)
    if (typeof openAwardCalculator === 'function') {
        openAwardCalculator();
    } else {
        showAlert('Award Calculator is not available. Please contact support.');
    }
}


// STEP 1: Position Details
// ========================================
function getStep1Template() {
    const data = contractBuilderState.data.step1;
    
    return `
        <h2 class="step-title">Position Details</h2>
        <p class="step-description">Provide the key information about this employment position.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <div class="form-group">
            <label class="form-label required">Position Title</label>
            <input type="text" class="form-input" id="positionTitle" name="positionTitle" 
                   value="${data.positionTitle}" 
                   placeholder="e.g., Head Chef, Front of House Manager, Barista">
            <span class="form-hint">Enter the official job title for this position</span>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Duties and Responsibilities</label>
            <div class="radio-group">
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="dutiesOption" value="attach" 
                               ${data.dutiesOption === 'attach' ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Attach position description later</div>
                            <div class="radio-description">I'll attach a separate PD document</div>
                        </div>
                    </label>
                </div>
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="dutiesOption" value="outline" 
                               ${data.dutiesOption === 'outline' ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Outline duties now</div>
                            <div class="radio-description">Include duties in the contract</div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        
        <div id="dutiesTextArea" style="display: ${data.dutiesOption === 'outline' ? 'block' : 'none'};">
            <div class="form-group">
                <label class="form-label">Key Duties</label>
                <textarea class="form-textarea" id="duties" name="duties" 
                          placeholder="Enter the main responsibilities and duties for this role...">${data.duties}</textarea>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Modern Award</label>
            <input type="text" class="form-input" id="awardName" name="awardName" 
                   value="${data.awardName}" 
                   placeholder="e.g., Hospitality Industry (General) Award">
            <span class="form-hint">
                Not sure? 
                <button class="btn btn-link" style="padding: 0; display: inline;" onclick="openAwardWizardFromContract(); return false;">Use Award Wizard</button>
            </span>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">What's a Modern Award?</span>
            </button>
            <div class="help-content">
                <p>A Modern Award is a legal document that sets out minimum pay rates and conditions of employment for a particular industry or occupation in Australia.</p>
                <p>The Hospitality Industry (General) Award covers most hospitality businesses including restaurants, cafes, hotels, catering, and clubs.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Business Structure</label>
            <select class="form-select" id="businessStructure" name="businessStructure">
                <option value="">Select business structure...</option>
                <option value="sole_trader" ${data.businessStructure === 'sole_trader' ? 'selected' : ''}>Sole Trader</option>
                <option value="partnership" ${data.businessStructure === 'partnership' ? 'selected' : ''}>Partnership</option>
                <option value="company" ${data.businessStructure === 'company' ? 'selected' : ''}>Company (Pty Ltd)</option>
                <option value="trust" ${data.businessStructure === 'trust' ? 'selected' : ''}>Trust</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">Workplace Address</label>
            <input type="text" class="form-input" id="workplaceAddress" name="workplaceAddress" 
                   value="${data.workplaceAddress}" 
                   placeholder="123 Main Street, Sydney NSW 2000">
            <span class="form-hint">The primary work location (can be added later)</span>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Employment Type</label>
            <div class="radio-group">
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="employmentType" value="full-time" 
                               ${data.employmentType === 'full-time' ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Full-time</div>
                            <div class="radio-description">38 hours per week</div>
                        </div>
                    </label>
                </div>
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="employmentType" value="part-time" 
                               ${data.employmentType === 'part-time' ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Part-time</div>
                            <div class="radio-description">Regular hours, less than 38/week</div>
                        </div>
                    </label>
                </div>
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="employmentType" value="casual" 
                               ${data.employmentType === 'casual' ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Casual</div>
                            <div class="radio-description">No fixed hours, casual loading</div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Employment Duration</label>
            <div class="radio-group">
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="isPermanent" value="true" 
                               ${data.isPermanent ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Ongoing/Permanent</div>
                        </div>
                    </label>
                </div>
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="isPermanent" value="false" 
                               ${!data.isPermanent ? 'checked' : ''}>
                        <div class="radio-content">
                            <div class="radio-text">Fixed-term</div>
                            <div class="radio-description">Has specific end date</div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Start Date</label>
            <input type="date" class="form-input" id="startDate" name="startDate" value="${data.startDate}">
        </div>
        
        <div id="endDateField" style="display: ${!data.isPermanent ? 'block' : 'none'};">
            <div class="form-group">
                <label class="form-label required">End Date</label>
                <input type="date" class="form-input" id="endDate" name="endDate" value="${data.endDate}">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label required">Probation Period</label>
            <select class="form-select" id="probationLength" name="probationLength">
                <option value="3" ${data.probationLength === '3' ? 'selected' : ''}>3 months</option>
                <option value="6" ${data.probationLength === '6' || !data.probationLength ? 'selected' : ''}>6 months (Recommended)</option>
                <option value="12" ${data.probationLength === '12' ? 'selected' : ''}>12 months</option>
            </select>
            <span class="form-hint">6 months is recommended for most hospitality roles to properly assess performance</span>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">Why have a probation period?</span>
            </button>
            <div class="help-content">
                <p>A probation period allows you to assess whether an employee is suitable for the role before confirming their ongoing employment.</p>
                <p><strong>Key benefits:</strong></p>
                <ul>
                    <li>Lower notice period required (typically 1 week)</li>
                    <li>Easier to terminate if not suitable</li>
                    <li>Time to assess skills and cultural fit</li>
                    <li>Standard practice in hospitality industry</li>
                </ul>
                <p><strong>6 months is recommended</strong> as it gives enough time to see performance across different service periods and busy/quiet times.</p>
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Hours & Work Pattern →</button>
        </div>
    `;
}

function initializeStep1Listeners() {
    // Duties option toggle
    document.querySelectorAll('input[name="dutiesOption"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const textArea = document.getElementById('dutiesTextArea');
            textArea.style.display = e.target.value === 'outline' ? 'block' : 'none';
        });
    });
    
    // Employment duration toggle
    document.querySelectorAll('input[name="isPermanent"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const endDateField = document.getElementById('endDateField');
            endDateField.style.display = e.target.value === 'false' ? 'block' : 'none';
        });
    });
    
    // Auto-save
    const inputs = document.querySelectorAll('#contractStepContent input, #contractStepContent select, #contractStepContent textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
}


function getStep2Template() {
    const data = contractBuilderState.data.step2;
    const empType = contractBuilderState.data.step1.employmentType;
    
    return `
        <h2 class="step-title">Hours of Work</h2>
        <p class="step-description">Define the working hours and conditions for this ${empType} position.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <!-- HOURS PER WEEK -->
        <div class="form-section">
            <h3 class="form-section-title required">How many ordinary hours per week will the employee work?</h3>
            <p class="form-section-description">The maximum weekly ordinary hours can vary between awards. Full-time employees usually work an average of 38 ordinary hours per week, part-time employees work less.</p>
            
            ${empType !== 'casual' ? `
            <div class="form-group">
                <div class="input-with-suffix">
                    <input type="number" class="form-input" id="hoursPerWeek" name="hoursPerWeek" 
                           value="${data.hoursPerWeek}" 
                           placeholder="${empType === 'full-time' ? '38' : 'e.g., 20'}"
                           min="1" max="50" step="0.5">
                    <span class="input-suffix">hour(s) per week</span>
                </div>
            </div>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Hours of work clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You are expected to work <strong>${data.hoursPerWeek || '[number]'}</strong> ordinary hour(s) per week. We may also request or require you to work additional hours if the additional hours are reasonable.</p>
                </div>
            </div>
            ` : `
            <div class="info-box">
                <div class="info-box-title">ℹ️ Casual Employment Hours</div>
                <div class="info-box-content">
                    <p>For casual employees, hours are not guaranteed and will vary based on roster requirements.</p>
                    <p>Casual employees receive a 25% loading instead of paid leave entitlements.</p>
                </div>
            </div>
            `}
        </div>
        
        <!-- SHIFTWORKER -->
        <div class="form-section">
            <h3 class="form-section-title required">Will the employee be a shiftworker?</h3>
            <p class="form-section-description">Whether your employee is considered a shiftworker will depend on the award they are under. 
            <a href="https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/shift-work" target="_blank" rel="noopener noreferrer">Check the award to see if it has a definition of shiftworker</a> – they're not all the same.</p>
            
            <div class="radio-group-vertical">
                <label class="radio-option-card">
                    <input type="radio" name="isShiftworker" value="yes" ${data.isShiftworker === 'yes' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>Yes – they meet the award definition of a shiftworker</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="isShiftworker" value="no" ${data.isShiftworker === 'no' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>No – they will not be a shiftworker</span>
                    </span>
                </label>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Check the award for hours</span>
                </button>
                <div class="help-content">
                    <p>The award sets out the:</p>
                    <ul>
                        <li>Maximum ordinary hours per day and week</li>
                        <li>Span of hours (when work can be performed)</li>
                        <li>Definition of shiftworker for your industry</li>
                        <li>Penalty rates for shift work</li>
                    </ul>
                    <p>Shift workers may be entitled to 5 weeks annual leave instead of 4 weeks.</p>
                </div>
            </div>
        </div>
        
        <!-- FLEXIBLE HOURS (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Flexible hours</h3>
            <p class="form-section-description">Include this clause to provide for employee requests to work flexible hours.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="flexibleHours" name="flexibleHours" 
                           ${data.flexibleHours ? 'checked' : ''} onchange="toggleClauseVisibility('flexibleHoursClause', this.checked)">
                    <span class="checkbox-text">Include Flexible hours clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.flexibleHours ? '' : 'collapsed'}" id="flexibleHoursClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Flexible hours clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>You may have a right to make a written request for flexible working arrangements under the National Employment Standards, including for when to start and end work each day or your location of work. We may refuse your request in writing, but only if we have reasonable business grounds.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Why provide flexible hours?</span>
                </button>
                <div class="help-content">
                    <p>Flexible hours can help support a positive employment relationship. For example, you might allow your employee to start and finish work earlier on some days to pick their child up from school.</p>
                    <p>Some employees are legally entitled to request flexible working arrangements (including flexible hours and patterns of work). You can only refuse these requests if you have a good business reason.</p>
                    <p>The right to request flexible working arrangements is a minimum entitlement in the National Employment Standards. You can't set conditions that are less than or exclude the National Employment Standards.</p>
                    <p><a href="https://www.fairwork.gov.au/employment-conditions/flexibility-in-the-workplace/flexible-working-arrangements" target="_blank" rel="noopener noreferrer">Find out more about flexible working arrangements</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <!-- AVERAGING HOURS (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Averaging hours over more than a week</h3>
            <p class="form-section-description">This allows averaging of the employee's ordinary hours over more than one week. This means they can work more one week and less in another. 
            <a href="https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/hours-of-work" target="_blank" rel="noopener noreferrer">Check the award for specific rules around averaging hours</a> before you select this clause.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="averagingHours" name="averagingHours" 
                           ${data.averagingHours ? 'checked' : ''} onchange="toggleClauseVisibility('averagingHoursClause', this.checked)">
                    <span class="checkbox-text">Include Averaging hours clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.averagingHours ? '' : 'collapsed'}" id="averagingHoursClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Averaging hours clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>Your hours per week may be averaged over more than one week in accordance with the award.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Example of averaging hours</span>
                </button>
                <div class="help-content">
                    <p><strong>Example:</strong> Cindy works in a restaurant as a full-time employee and is covered by the Restaurant Industry Award. She averages her 38 hours a week by working 76 hours over 2 weeks. She works 42 hours the first week, and 34 hours the second week. 42 + 34 = 76 hours. So over 2 weeks she works an average of 38 hours per week.</p>
                    <p>This arrangement is also consistent with other rules in the Restaurant Industry Award 2020 about ordinary hours of work.</p>
                </div>
            </div>
        </div>
        
        <!-- ON CALL OR STAND-BY (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">On call or stand-by</h3>
            <p class="form-section-description">Include this if you'll sometimes want your employee to be on call (stand-by).</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="onCallStandby" name="onCallStandby" 
                           ${data.onCallStandby ? 'checked' : ''} onchange="toggleClauseVisibility('onCallClause', this.checked)">
                    <span class="checkbox-text">Include On call or stand-by clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.onCallStandby ? '' : 'collapsed'}" id="onCallClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">On call or stand-by clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>We may require you to be on call (on stand-by) for work outside your normal hours.</p>
                    <p>Your on call or stand-by conditions will be in accordance with the award, including:</p>
                    <ul>
                        <li>rostering to be on call</li>
                        <li>pay rates or allowances when on call</li>
                        <li>pay rates if you are called out to work while on call.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">On call rules & Right to disconnect</span>
                </button>
                <div class="help-content">
                    <p><strong>On call rules:</strong> On call means your employee is ready and available to work if you need them outside their normal work hours. If you want your employee to be on call (on stand-by), be aware that there may be rules in the award for:</p>
                    <ul>
                        <li>if and when you're allowed to roster your employee to be on call</li>
                        <li>pay rates or allowances when on call</li>
                        <li>pay rates if called out to work while on call</li>
                    </ul>
                    <p><strong>Right to disconnect:</strong> Employees have the right to refuse to monitor, read or respond to contact (or attempted contact) from their employer or a third-party outside of working hours, unless the refusal is unreasonable. Several factors must be considered when determining whether an employee's refusal is unreasonable, such as whether they are receiving compensation to be on call.</p>
                    <p><a href="https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/right-to-disconnect" target="_blank" rel="noopener noreferrer">Learn about the right to disconnect</a> on the Fair Work Ombudsman's website.</p>
                </div>
            </div>
        </div>
        
        <!-- ROSTERS (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Rosters</h3>
            <p class="form-section-description">Include this clause to specify roster notice periods. Check the award rules for rosters on the <a href="https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/rosters" target="_blank" rel="noopener noreferrer">Fair Work Ombudsman's Rosters page</a>.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="includeRostersClause" name="includeRostersClause" 
                           ${data.includeRostersClause ? 'checked' : ''} onchange="toggleRosterFields(this.checked)">
                    <span class="checkbox-text">Include Rosters clause (optional)</span>
                </label>
            </div>
            
            <div class="roster-fields ${data.includeRostersClause ? '' : 'collapsed'}" id="rosterFields">
                <div class="form-group">
                    <label class="form-label">How long before the start of a roster will you provide it to your employee?</label>
                    <p class="form-hint">e.g. 14 days (rosters are typically provided 7 or 14 days before they start).</p>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="rosterNoticeDays" name="rosterNoticeDays" 
                               value="${data.rosterNoticeDays || '7'}" min="1" max="30" placeholder="7">
                        <span class="input-suffix">day(s)</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">How much notice will you give your employee if you want to change the roster?</label>
                    <p class="form-hint">Changes to rosters typically require 7 days' notice for full and part-time employees.</p>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="rosterChangeDays" name="rosterChangeDays" 
                               value="${data.rosterChangeDays || '7'}" min="1" max="30" placeholder="7">
                        <span class="input-suffix">day(s)</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">How much notice will you require from your employee when they ask for a roster change?</label>
                    <p class="form-hint">e.g. 7 days.</p>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="employeeRosterNoticeDays" name="employeeRosterNoticeDays" 
                               value="${data.employeeRosterNoticeDays || '7'}" min="1" max="30" placeholder="7">
                        <span class="input-suffix">day(s)</span>
                    </div>
                </div>
                
                <div class="info-box" style="margin-bottom: 16px;">
                    <div class="info-box-content">
                        <p>ℹ️ Make sure you check the award. Some have rules around when to provide rosters and how many days' notice you need to change them.</p>
                    </div>
                </div>
                
                <div class="clause-preview" id="rostersClause">
                    <div class="clause-header">
                        <span class="clause-icon">📋</span>
                        <span class="clause-title">Rosters clause</span>
                        <span class="clause-badge included">Included</span>
                    </div>
                    <div class="clause-content">
                        <p>We will provide you with your days and hours of work in a roster at least <strong>${data.rosterNoticeDays || '[number]'}</strong> day(s) before the start of the roster.</p>
                        <p>If we need to change your roster, we will give you <strong>${data.rosterChangeDays || '[number]'}</strong> days' notice or ask for your agreement to the change.</p>
                        <p>If you wish to ask for a change to your roster, we require <strong>${data.employeeRosterNoticeDays || '[number]'}</strong> days' notice. You will need our agreement to the change.</p>
                    </div>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Roster rules</span>
                </button>
                <div class="help-content">
                    <p>A roster is a timetable that shows the days and times your employees are required to work.</p>
                    <p>Some awards have rules for rosters, including:</p>
                    <ul>
                        <li>when and how you need to provide them</li>
                        <li>notice you need to give your employee to change their roster</li>
                        <li>how to change a roster</li>
                        <li>consultation with your employee about changes to their regular roster</li>
                    </ul>
                    <p>Your employee should also give you notice when asking for a change to their roster, and they'll need your agreement to the change.</p>
                </div>
            </div>
        </div>
        
        <!-- BREAKS (Always Included) -->
        <div class="form-section">
            <h3 class="form-section-title">Breaks</h3>
            <p class="form-section-description">This provides a general clause in your employment contract about your employee's entitlement to breaks. Entitlements to breaks vary between awards, so check the award for details.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Breaks clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>Depending on the number of hours you work, you may be entitled to meal breaks. The award sets out:</p>
                    <ul>
                        <li>the length of the breaks</li>
                        <li>when they need to be taken</li>
                        <li>the rules about payment.</li>
                    </ul>
                    <p>You may also be entitled to rest breaks.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Breaks vary between awards</span>
                </button>
                <div class="help-content">
                    <p>Awards have different rules for rest breaks and meal breaks, including:</p>
                    <ul>
                        <li>the length of the breaks</li>
                        <li>when they need to be taken</li>
                        <li>the rules about payment</li>
                        <li>what happens if you don't provide a break</li>
                    </ul>
                    <p><a href="https://www.fairwork.gov.au/employment-conditions/hours-of-work-breaks-and-rosters/breaks" target="_blank" rel="noopener noreferrer">Find out more about breaks in your industry</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Pay & Conditions →</button>
        </div>
    `;
}

// Toggle clause visibility based on checkbox
function toggleClauseVisibility(clauseId, isVisible) {
    const clause = document.getElementById(clauseId);
    if (clause) {
        if (isVisible) {
            clause.classList.remove('collapsed');
        } else {
            clause.classList.add('collapsed');
        }
    }
    saveCurrentStepData();
}

function toggleRosterFields(isVisible) {
    const rosterFields = document.getElementById('rosterFields');
    if (rosterFields) {
        if (isVisible) {
            rosterFields.classList.remove('collapsed');
        } else {
            rosterFields.classList.add('collapsed');
        }
    }
    saveCurrentStepData();
}

function initializeStep2Listeners() {
    const inputs = document.querySelectorAll('#contractStepContent input, #contractStepContent select, #contractStepContent textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
            // Update clause previews with current values
            updateStep2ClausePreviews();
        });
    });
}

function updateStep2ClausePreviews() {
    // Update hours clause with current value
    const hoursInput = document.getElementById('hoursPerWeek');
    const rostersClause = document.getElementById('rostersClause');
    
    if (rostersClause) {
        const rosterNoticeDays = document.getElementById('rosterNoticeDays')?.value || '[number]';
        const rosterChangeDays = document.getElementById('rosterChangeDays')?.value || '[number]';
        const employeeRosterNoticeDays = document.getElementById('employeeRosterNoticeDays')?.value || '[number]';
        
        const clauseContent = rostersClause.querySelector('.clause-content');
        if (clauseContent) {
            clauseContent.innerHTML = `
                <p>We will provide you with your days and hours of work in a roster at least <strong>${rosterNoticeDays}</strong> day(s) before the start of the roster.</p>
                <p>If we need to change your roster, we will give you <strong>${rosterChangeDays}</strong> days' notice or ask for your agreement to the change.</p>
                <p>If you wish to ask for a change to your roster, we require <strong>${employeeRosterNoticeDays}</strong> days' notice. You will need our agreement to the change.</p>
            `;
        }
    }
}


function getStep3Template() {
    const data = contractBuilderState.data.step3;
    const empType = contractBuilderState.data.step1.employmentType;
    
    return `
        <h2 class="step-title">Pay and Conditions</h2>
        <p class="step-description">Set the compensation details for this position.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <!-- PAY RATE -->
        <div class="form-section">
            <h3 class="form-section-title required">What is the employee's rate of pay?</h3>
            <p class="form-section-description">Select an hourly or a weekly rate of pay. Use the <a href="https://www.fairwork.gov.au/pay-and-wages/paying-wages" target="_blank" rel="noopener noreferrer">Fair Work Ombudsman's Pay and Conditions Tool</a> to find minimum pay rates for your employee's classification level.</p>
            
            <div class="radio-group-vertical" style="margin-bottom: 16px;">
                <label class="radio-option-card">
                    <input type="radio" name="payRateType" value="hourly" ${data.payRateType === 'hourly' ? 'checked' : ''} onchange="updatePayRateLabel()">
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>hourly</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="payRateType" value="weekly" ${data.payRateType === 'weekly' ? 'checked' : ''} onchange="updatePayRateLabel()">
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>weekly</span>
                    </span>
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" id="payRateLabelText">Enter the ${data.payRateType || 'hourly'} pay rate</label>
                <div class="input-with-prefix-suffix">
                    <span class="input-prefix">$AUD</span>
                    <input type="number" class="form-input" id="payRate" name="payRate" 
                           value="${data.payRate}" 
                           placeholder="0.00"
                           step="0.01" min="0">
                    <span class="input-suffix" id="payRateSuffix">per ${data.payRateType === 'weekly' ? 'week' : 'hour'}</span>
                </div>
            </div>
            
            <div class="info-box" style="border-color: #17a2b8; background: #e7f6f8;">
                <div class="info-box-title" style="color: #0c5460;">ℹ️ Award minimum rate</div>
                <div class="info-box-content">
                    <p>Enter an amount that, at least, covers the minimum award rate that applies to your employee's classification. Award minimum rates for juniors, apprentices, trainees or employees on a supported wage may be lower.</p>
                    <p>Some awards also include introductory minimum rates for the early stages of jobs or entry level jobs. These typically can only apply on a temporary basis. Check the award for more information.</p>
                </div>
            </div>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Pay clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You will be paid <strong>$${data.payRate || '[number]'}</strong> per <strong>${data.payRateType === 'weekly' ? 'week' : 'hour'}</strong>. This pay rate does not include superannuation, we'll pay this separately.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Wages</span>
                </button>
                <div class="help-content">
                    <p>Your employee's minimum wages are set out under the award – you must pay at least this amount. You'll also have to pay any applicable penalties, overtime, loadings and allowances.</p>
                </div>
            </div>
        </div>
        
        <!-- PAYMENT METHOD -->
        <div class="form-section">
            <h3 class="form-section-title required">How often will you pay your employee?</h3>
            <p class="form-section-description">Check how often you have to pay by selecting the employee's award on the <a href="https://www.fairwork.gov.au/pay-and-wages/paying-wages" target="_blank" rel="noopener noreferrer">Fair Work Ombudsman's Frequency of pay page</a>.</p>
            
            <div class="radio-group-vertical" style="margin-bottom: 20px;">
                <label class="radio-option-card">
                    <input type="radio" name="payFrequency" value="weekly" ${data.payFrequency === 'weekly' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>weekly</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="payFrequency" value="fortnightly" ${data.payFrequency === 'fortnightly' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>fortnightly</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="payFrequency" value="monthly" ${data.payFrequency === 'monthly' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>monthly</span>
                    </span>
                </label>
            </div>
            
            <h3 class="form-section-title required">How will you pay your employee?</h3>
            <p class="form-section-description">It's up to you which method you use, but record keeping might be easier if you pay electronically into a bank account.</p>
            
            <div class="radio-group-vertical">
                <label class="radio-option-card">
                    <input type="radio" name="payMethod" value="bank" ${data.payMethod === 'bank' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>into the employee's nominated bank account</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="payMethod" value="cash" ${data.payMethod === 'cash' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>in cash</span>
                    </span>
                </label>
                <label class="radio-option-card">
                    <input type="radio" name="payMethod" value="cheque" ${data.payMethod === 'cheque' ? 'checked' : ''}>
                    <span class="radio-card-content">
                        <span class="radio-indicator"></span>
                        <span>by cheque</span>
                    </span>
                </label>
            </div>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Payment method clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>We will pay you <strong>${data.payFrequency || 'weekly'}</strong> into your nominated bank account.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">How and when to pay</span>
                </button>
                <div class="help-content">
                    <p>Most awards outline how often you must pay employees – generally it will be weekly or fortnightly, and it must be at least monthly. You must pay money. Do not 'pay in kind', for example, with goods or food.</p>
                </div>
            </div>
        </div>
        
        <!-- SUPERANNUATION -->
        <div class="form-section">
            <h3 class="form-section-title">Superannuation</h3>
            <p class="form-section-description">To avoid the superannuation guarantee charge (SGC), you must ensure super guarantee (SG) contributions for eligible employees are:</p>
            <ul style="color: #495057; margin: 0 0 16px 20px; font-size: 14px;">
                <li>paid at the correct amount in full</li>
                <li>received by their super fund by the quarterly due dates</li>
                <li>paid into a fund that meets the choice of fund rules.</li>
            </ul>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Superannuation clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>If you are eligible for the super guarantee (SG), we will pay the contributions on your behalf in accordance with legislation and your award. We will pay contributions into a super fund of your choice.</p>
                    <p>If you do not tell us your choice of fund, we may need to contact the ATO to find out if you have a 'stapled' super fund to make your SG contributions into.</p>
                    <p>If you do not tell us your choice of fund and the ATO confirms you don't have a stapled super fund, we will pay your SG contributions to our default fund or another fund that meets the choice of fund rules.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Is your employee eligible?</span>
                </button>
                <div class="help-content">
                    <p>Generally, all employees are eligible for super guarantee (SG) regardless of how much they earn. It doesn't matter if they are:</p>
                    <ul>
                        <li>full-time, part-time, or casual</li>
                        <li>a temporary resident</li>
                        <li>receiving a super pension or annuity while still working</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- ADDITIONAL SUPER CONTRIBUTIONS (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Additional super contributions</h3>
            <p class="form-section-description">Select this clause if the <a href="https://www.fairwork.gov.au/pay-and-wages/superannuation" target="_blank" rel="noopener noreferrer">award requires additional super</a> on top of the super guarantee (SG). If the award does not require additional super, you can choose whether to pay extra as an incentive to your employee.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="additionalSuper" name="additionalSuper" 
                           ${data.additionalSuper ? 'checked' : ''} onchange="toggleClauseVisibility('additionalSuperClause', this.checked)">
                    <span class="checkbox-text">Include Additional superannuation clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.additionalSuper ? '' : 'collapsed'}" id="additionalSuperClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Additional superannuation clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label">Additional super percentage:</label>
                        <div class="input-with-suffix" style="max-width: 150px;">
                            <input type="number" class="form-input" id="additionalSuperPercent" name="additionalSuperPercent" 
                                   value="${data.additionalSuperPercent || ''}" placeholder="0" step="0.5" min="0" max="50">
                            <span class="input-suffix">%</span>
                        </div>
                    </div>
                    <p>In addition to the SG, we will contribute <strong>${data.additionalSuperPercent || '[number]'} percent</strong> of your base salary into super.</p>
                </div>
            </div>
        </div>
        
        <!-- PENALTY RATES AND OVERTIME (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Penalty rates and overtime</h3>
            <p class="form-section-description">Your employee may be entitled to overtime or penalty rates, depending on the hours they work. You must pay overtime or penalty rates if your employee is entitled to them, even if you do not include this clause.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="penaltyRatesOvertime" name="penaltyRatesOvertime" 
                           ${data.penaltyRatesOvertime ? 'checked' : ''} onchange="toggleClauseVisibility('penaltyRatesClause', this.checked)">
                    <span class="checkbox-text">Include Penalty rates and overtime clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.penaltyRatesOvertime ? '' : 'collapsed'}" id="penaltyRatesClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Penalty rates and overtime clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>You may be entitled to overtime rates under your award if you work:</p>
                    <ul>
                        <li>more than your ordinary hours of work</li>
                        <li>outside the spread of ordinary hours.</li>
                    </ul>
                    <p>You may be entitled to penalty rates or shift loadings according to your award if you work:</p>
                    <ul>
                        <li>on a weekend</li>
                        <li>on a public holiday</li>
                        <li>late night or early morning shifts.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Rules vary between awards</span>
                </button>
                <div class="help-content">
                    <p>The rules around penalty rates and overtime differ between awards. Check the award for details (including pay rates).</p>
                    <p>Find out more about <a href="https://www.fairwork.gov.au/pay-and-wages/penalty-rates-and-allowances" target="_blank" rel="noopener noreferrer">penalty rates</a> and <a href="https://www.fairwork.gov.au/pay-and-wages/overtime" target="_blank" rel="noopener noreferrer">overtime</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <!-- ALLOWANCES (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Allowances</h3>
            <p class="form-section-description">Include this to add a general allowances clause to your employment agreement. You must pay allowances if your employee is entitled to them, even if you do not include this clause.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="allowances" name="allowances" 
                           ${data.allowances ? 'checked' : ''} onchange="toggleClauseVisibility('allowancesClause', this.checked)">
                    <span class="checkbox-text">Include Allowances clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.allowances ? '' : 'collapsed'}" id="allowancesClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Allowances clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>You may be entitled to allowances in accordance with your award, for example, if you:</p>
                    <ul>
                        <li>do certain tasks or are required to use a particular skill in the duties of your role</li>
                        <li>have to use your own tools at work</li>
                        <li>work in particular conditions, environments or in remote locations.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Examples of allowances</span>
                </button>
                <div class="help-content">
                    <p>Allowances are extra payments you may have to provide to your employee if they:</p>
                    <ul>
                        <li>use their own vehicle for work</li>
                        <li>work in unpleasant or hazardous conditions</li>
                        <li>hold special qualifications or licenses</li>
                        <li>are required to wear a uniform</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- COMMISSION (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Commission</h3>
            <p class="form-section-description">Include this if you plan to pay your employee commission on top of their wages or salary.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="commission" name="commission" 
                           ${data.commission ? 'checked' : ''} onchange="toggleClauseVisibility('commissionClause', this.checked)">
                    <span class="checkbox-text">Include Commission clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.commission ? '' : 'collapsed'}" id="commissionClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Commission clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>In addition to your base pay, we will pay you commission under the following arrangement:</p>
                    <div class="form-group" style="margin: 12px 0;">
                        <textarea class="form-textarea" id="commissionArrangement" name="commissionArrangement" 
                                  placeholder="Describe the commission arrangement, e.g., '5% of sales revenue generated by the employee'"
                                  style="min-height: 80px;">${data.commissionArrangement || ''}</textarea>
                    </div>
                    <p>If we agree to change this commission arrangement during your employment with us, we will update this employment contract. Any changes to your commission arrangement will be made according to the requirements of the modern award which applies to you.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">What commission is</span>
                </button>
                <div class="help-content">
                    <p>Commission is an amount paid to your employee, usually based on how much they sell. It's often calculated as either:</p>
                    <ul>
                        <li>a percentage of sales</li>
                        <li>a flat amount per sale or unit</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- ANNUAL BONUS (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Annual bonus</h3>
            <p class="form-section-description">Include this if you want to use an annual bonus as an incentive to your employee.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="annualBonus" name="annualBonus" 
                           ${data.annualBonus ? 'checked' : ''} onchange="toggleClauseVisibility('annualBonusClause', this.checked)">
                    <span class="checkbox-text">Include Annual bonus clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.annualBonus ? '' : 'collapsed'}" id="annualBonusClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Annual bonus clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>We may pay you an annual bonus at our discretion, taking into consideration your performance and other relevant business factors.</p>
                    <p>There is no guarantee that you will get a bonus, and you will not be eligible for one after your employment with us ends.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Why offer a bonus?</span>
                </button>
                <div class="help-content">
                    <p>An annual bonus can be a great way to reward your employee's hard work throughout the year.</p>
                    <p>Whether you pay a bonus will be your decision, based on your employee's performance, how the business is going and other relevant factors.</p>
                </div>
            </div>
        </div>
        
        <!-- ANNUAL PAY REVIEW (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Annual pay review</h3>
            <p class="form-section-description">An annual pay review can help ensure you're paying your employee the right rate and keep them motivated.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="annualPayReview" name="annualPayReview" 
                           ${data.annualPayReview ? 'checked' : ''} onchange="toggleClauseVisibility('annualPayReviewClause', this.checked)">
                    <span class="checkbox-text">Include Annual pay review clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.annualPayReview ? '' : 'collapsed'}" id="annualPayReviewClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Annual pay review clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>We will review your pay annually to determine whether you are eligible for an increase, taking into consideration:</p>
                    <ul>
                        <li>your performance</li>
                        <li>the business's financial position.</li>
                    </ul>
                    <p>Any increase in your pay, above your award entitlements, is our decision.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Benefits of a pay review</span>
                </button>
                <div class="help-content">
                    <p>This is a good way to reward your employee's work over the year. It also helps ensure that you're keeping up with any award changes to minimum pay rates.</p>
                </div>
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Leave Entitlements →</button>
        </div>
    `;
}

function updatePayRateLabel() {
    const payRateType = document.querySelector('input[name="payRateType"]:checked')?.value || 'hourly';
    const labelText = document.getElementById('payRateLabelText');
    const suffix = document.getElementById('payRateSuffix');
    
    if (labelText) {
        labelText.textContent = 'Enter the ' + payRateType + ' pay rate';
    }
    if (suffix) {
        suffix.textContent = 'per ' + (payRateType === 'weekly' ? 'week' : 'hour');
    }
    
    saveCurrentStepData();
}

function initializeStep3Listeners() {
    const inputs = document.querySelectorAll('#contractStepContent input, #contractStepContent select, #contractStepContent textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
}

// ========================================
// STEP 4: Leave Entitlements
// ========================================
function getStep4Template() {
    const data = contractBuilderState.data.step4;
    const empType = contractBuilderState.data.step1.employmentType;
    
    return `
        <h2 class="step-title">Leave Entitlements</h2>
        <p class="step-description">This section outlines the leave entitlements for this ${empType} position.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        ${empType === 'casual' ? `
        <div class="info-box" style="border-color: #17a2b8; background: #e7f6f8; margin-bottom: 24px;">
            <div class="info-box-title" style="color: #0c5460;">ℹ️ Casual employees and leave</div>
            <div class="info-box-content">
                <p>Casual employees generally don't receive paid annual leave or personal/carer's leave. Instead, they receive a casual loading (typically 25%) to compensate.</p>
                <p>However, casual employees are still entitled to:</p>
                <ul>
                    <li>2 days unpaid carer's leave per occasion</li>
                    <li>2 days unpaid compassionate leave per occasion</li>
                    <li>Community service leave</li>
                    <li>Family and domestic violence leave</li>
                </ul>
            </div>
        </div>
        ` : ''}
        
        ${empType !== 'casual' ? `
        <!-- ANNUAL LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title required">Annual leave</h3>
            <p class="form-section-description">An employee (other than a casual employee) generally accumulates 4 weeks of paid annual leave for each year of service with the employer based on their ordinary hours of work.</p>
            <p class="form-section-description">Some awards can provide more than 4 weeks of annual leave. Shiftworkers who meet the definition of a shiftworker in their award are also entitled to an extra week of annual leave.</p>
            <p class="form-section-description">Check your employee's award to see if they are entitled to more than 4 weeks of annual leave each year.</p>
            
            <div class="form-group">
                <label class="form-label">Would you like to measure your employee's annual leave in weeks, days or hours?</label>
                <div class="radio-group-vertical" style="margin-top: 8px;">
                    <label class="radio-option-card">
                        <input type="radio" name="annualLeaveMeasure" value="weeks" ${data.annualLeaveMeasure === 'weeks' ? 'checked' : ''} onchange="updateAnnualLeaveClause()">
                        <span class="radio-card-content">
                            <span class="radio-indicator"></span>
                            <span>Weeks</span>
                        </span>
                    </label>
                    <label class="radio-option-card">
                        <input type="radio" name="annualLeaveMeasure" value="days" ${data.annualLeaveMeasure === 'days' ? 'checked' : ''} onchange="updateAnnualLeaveClause()">
                        <span class="radio-card-content">
                            <span class="radio-indicator"></span>
                            <span>Days</span>
                        </span>
                    </label>
                    <label class="radio-option-card">
                        <input type="radio" name="annualLeaveMeasure" value="hours" ${data.annualLeaveMeasure === 'hours' ? 'checked' : ''} onchange="updateAnnualLeaveClause()">
                        <span class="radio-card-content">
                            <span class="radio-indicator"></span>
                            <span>Hours</span>
                        </span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">How much annual leave will your employee get each year?</label>
                <p class="form-hint">Enter an amount based on their ordinary hours of work</p>
                <div class="input-with-suffix">
                    <input type="number" class="form-input" id="annualLeaveAmount" name="annualLeaveAmount" 
                           value="${data.annualLeaveAmount || '4'}" min="1" max="52" placeholder="4" onchange="updateAnnualLeaveClause()">
                    <span class="input-suffix" id="annualLeaveSuffix">${data.annualLeaveMeasure || 'week'}(s)</span>
                </div>
            </div>
            
            <div class="clause-preview" id="annualLeaveClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Annual leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You are entitled to <strong>${data.annualLeaveAmount || '4'} ${data.annualLeaveMeasure || 'week'}(s)</strong> of annual leave each year, based on your ordinary hours of work per week.</p>
                    <p>We will provide any applicable annual leave loading entitlements in accordance with your award.</p>
                    <p>Annual leave accumulates during the year. Any unused annual leave will roll over from year to year.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">How much annual leave</span>
                </button>
                <div class="help-content">
                    <p>Under the National Employment Standards (NES), full-time and part-time employees accrue 4 weeks of paid annual leave each year, based on their ordinary hours of work. Annual leave accumulates gradually during the year (pro-rata for part-time employees).</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- PARENTAL LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Parental leave</h3>
            <p class="form-section-description">Your employee may be entitled to 12 months of unpaid parental leave after working for you for at least 12 months.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Parental leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>After you have been working for us for 12 months or more, you may be entitled to take unpaid parental leave from your position for 12 months.</p>
                    <p>You may also:</p>
                    <ul>
                        <li>request up to an extra 12 months of unpaid parental leave</li>
                        <li>be entitled to Parental Leave Pay from the Australian Government, administered by Services Australia.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Who gets parental leave</span>
                </button>
                <div class="help-content">
                    <p>The parental leave entitlement applies to full and part-time employees. Casual employees may also get parental leave if they:</p>
                    <ul>
                        <li>have worked for you on a regular and systematic basis for 12 months or more</li>
                        <li>had a reasonable expectation of continuing their employment on a regular and systematic basis had it not been for the birth or adoption of a child.</li>
                    </ul>
                    <p><a href="https://www.fairwork.gov.au/leave/maternity-and-parental-leave" target="_blank" rel="noopener noreferrer">Find out more about parental leave</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <!-- ADDITIONAL PARENTAL LEAVE (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Additional parental leave</h3>
            <p class="form-section-description">You can choose whether to provide additional paid leave (on top of the above parental leave) as an incentive.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="additionalParentalLeave" name="additionalParentalLeave" 
                           ${data.additionalParentalLeave ? 'checked' : ''} onchange="toggleClauseVisibility('additionalParentalLeaveClause', this.checked)">
                    <span class="checkbox-text">Include Additional parental leave clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.additionalParentalLeave ? '' : 'collapsed'}" id="additionalParentalLeaveClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Additional parental leave clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label">Number of weeks:</label>
                        <div class="input-with-suffix" style="max-width: 150px;">
                            <input type="number" class="form-input" id="additionalParentalLeaveWeeks" name="additionalParentalLeaveWeeks" 
                                   value="${data.additionalParentalLeaveWeeks || ''}" placeholder="0" min="0" max="52">
                            <span class="input-suffix">week(s)</span>
                        </div>
                    </div>
                    <p>In addition to the above parental leave, we will provide you with <strong>${data.additionalParentalLeaveWeeks || '[number]'} week(s)</strong> paid parental leave.</p>
                </div>
            </div>
        </div>
        
        ${empType !== 'casual' ? `
        <!-- PERSONAL/CARER'S LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Personal/carer's leave</h3>
            <p class="form-section-description">This sets out your employee's entitlement to personal and carer's leave in your employment contract. Casual employees are entitled to unpaid carer's leave.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Personal/carer's leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You are entitled to accrue 10 days paid personal/carer's leave (pro-rata for part-time employees) per year based on your ordinary hours of work. This is calculated as 1/26 of your ordinary hours of work in a year.</p>
                    <p>You can take personal/carer's leave when you can't work because you are sick or injured. You can also use it to care for a member of your immediate family or household who requires care or support because of:</p>
                    <ul>
                        <li>personal injury</li>
                        <li>personal illness</li>
                        <li>an unexpected emergency.</li>
                    </ul>
                    <p>Your personal/carer's leave accrues throughout the year and from year to year. You must give us notice as soon as possible to take personal/carer's leave. We may also require evidence (such as a medical certificate).</p>
                    <p>You are also entitled to 2 days unpaid carer's leave (in accordance with the National Employment Standards). This is available each time an immediate family member or household member needs your care or support. You can only take unpaid carer's leave if you do not have any paid personal/carer's leave left.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Personal, carer's and sick leave</span>
                </button>
                <div class="help-content">
                    <p>Personal/carer's leave (sometimes called sick and carer's leave) is for when your employee cannot work because:</p>
                    <ul>
                        <li>they're sick or injured, or</li>
                        <li>a member of their immediate family or household needs their care or support for an injury, sickness or unexpected emergency.</li>
                    </ul>
                    <p><a href="https://www.fairwork.gov.au/leave/sick-and-carers-leave" target="_blank" rel="noopener noreferrer">Find out more about personal/carer's leave</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- COMPASSIONATE LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Compassionate leave</h3>
            <p class="form-section-description">This sets out compassionate leave entitlements in your employment contract.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Compassionate leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You are entitled to 2 days ${empType === 'casual' ? 'unpaid' : 'paid'} compassionate leave (in accordance with the National Employment Standards) each time:</p>
                    <ul>
                        <li>a member of your immediate family or household dies, or contracts or develops a life threatening illness or injury</li>
                        <li>a child is stillborn, that would have been a member of your immediate family or household if born alive</li>
                        <li>you or your current spouse or de facto partner has a miscarriage.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Paid or unpaid?</span>
                </button>
                <div class="help-content">
                    <ul>
                        <li>Full and part-time employees get paid compassionate leave.</li>
                        <li>Casual employees get unpaid compassionate leave.</li>
                    </ul>
                    <p><a href="https://www.fairwork.gov.au/leave/compassionate-and-bereavement-leave" target="_blank" rel="noopener noreferrer">Find out more about compassionate and bereavement leave</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <!-- COMMUNITY SERVICE LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Community service leave</h3>
            <p class="form-section-description">This sets out your employee's entitlement to community service leave in your employment contract.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Community service leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You may be entitled to community service leave (in accordance with the National Employment Standards) for certain activities such as:</p>
                    <ul>
                        <li>voluntary emergency management activities</li>
                        <li>jury duty and jury selection.</li>
                    </ul>
                    <p>You must give us:</p>
                    <ul>
                        <li>notice of your leave as soon as possible</li>
                        <li>details of the period, or expected period, that you will be away from work.</li>
                    </ul>
                    <p>We may ask you to provide evidence that you require community service leave.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Community service leave entitlements</span>
                </button>
                <div class="help-content">
                    <p>Community service leave is unpaid, except for the first 10 days of absence from work because of jury duty.</p>
                </div>
            </div>
        </div>
        
        <!-- FAMILY AND DOMESTIC VIOLENCE LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Family and domestic violence leave</h3>
            <p class="form-section-description">This sets out your employee's entitlement to family and domestic violence leave in your employment contract.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Family and domestic violence leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You may be entitled to 10 days of paid family and domestic violence leave (in accordance with the National Employment Standards) each 12 month period.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Who it applies to</span>
                </button>
                <div class="help-content">
                    <p>All employees (including part-time and casual employees) are entitled to 10 full days of paid family and domestic violence leave each 12 month period.</p>
                </div>
            </div>
        </div>
        
        <!-- PUBLIC HOLIDAYS -->
        <div class="form-section">
            <h3 class="form-section-title">Public holidays</h3>
            <p class="form-section-description">This sets out the work and pay rules for public holidays in your employment contract.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Public holiday clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You have a right to be absent from work on a public holiday.</p>
                    <p>We may ask you to work on a public holiday. You may refuse our request to work (in accordance with the Fair Work Act 2009) if:</p>
                    <ul>
                        <li>your refusal is reasonable, or</li>
                        <li>our request is unreasonable.</li>
                    </ul>
                    <p>If you work on a public holiday, you are entitled to any additional entitlements under your award, such as public holiday penalty rates.</p>
                    <p>If you do not work on a public holiday, and it falls on a day you would normally work, you are entitled to be paid your base rate of pay for your ordinary hours of work on that day.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Work on a public holiday</span>
                </button>
                <div class="help-content">
                    <ul>
                        <li>You can ask an employee to work on a public holiday – if it's reasonable.</li>
                        <li>If they do work, you'll need to pay them at least the award rates for public holidays.</li>
                    </ul>
                    <p><a href="https://www.fairwork.gov.au/leave/public-holidays" target="_blank" rel="noopener noreferrer">Find out more about public holidays</a> on the Fair Work Ombudsman website.</p>
                </div>
            </div>
        </div>
        
        <!-- LONG SERVICE LEAVE -->
        <div class="form-section">
            <h3 class="form-section-title">Long service leave</h3>
            <p class="form-section-description">This provides an overview of long service leave in your employment contract.</p>
            <p class="form-section-description">Long service leave rules differ between states and territories, as well as between industries, so specific details are not provided here.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Long service leave clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You may be entitled to long service leave after working with us for a specific period of time in accordance with relevant state or territory legislation or the Fair Work Act.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Long service leave laws</span>
                </button>
                <div class="help-content">
                    <p>State and territory laws (and in some cases long service leave terms under pre-modern awards which have been preserved under the National Employment Standards) set out how:</p>
                    <ul>
                        <li>long service leave accrues</li>
                        <li>when it can be taken</li>
                        <li>how much leave an employee gets</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Additional Terms →</button>
        </div>
    `;
}

function updateAnnualLeaveClause() {
    const measure = document.querySelector('input[name="annualLeaveMeasure"]:checked')?.value || 'weeks';
    const amount = document.getElementById('annualLeaveAmount')?.value || '4';
    
    // Update suffix label
    const suffix = document.getElementById('annualLeaveSuffix');
    if (suffix) {
        suffix.textContent = measure === 'weeks' ? 'week(s)' : measure === 'days' ? 'day(s)' : 'hour(s)';
    }
    
    // Update clause preview
    const clause = document.getElementById('annualLeaveClause');
    if (clause) {
        const clauseContent = clause.querySelector('.clause-content');
        if (clauseContent) {
            clauseContent.innerHTML = `
                <p>You are entitled to <strong>${amount} ${measure === 'weeks' ? 'week' : measure === 'days' ? 'day' : 'hour'}(s)</strong> of annual leave each year, based on your ordinary hours of work per week.</p>
                <p>We will provide any applicable annual leave loading entitlements in accordance with your award.</p>
                <p>Annual leave accumulates during the year. Any unused annual leave will roll over from year to year.</p>
            `;
        }
    }
    
    saveCurrentStepData();
}

function initializeStep4Listeners() {
    const inputs = document.querySelectorAll('#contractStepContent input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
}

// ========================================
// STEP 5: Additional Terms and Obligations
// ========================================
function getStep5Template() {
    const data = contractBuilderState.data.step5;
    
    return `
        <h2 class="step-title">Additional Terms and Obligations</h2>
        <p class="step-description">Select optional clauses to include in the contract.</p>
        
        <div class="info-box">
            <div class="info-box-content">
                <p>These clauses are <strong>optional</strong> but recommended for protecting your business interests. Select the ones relevant to this position.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="employeeObligations" name="employeeObligations" 
                       ${data.employeeObligations ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Employee Obligations</strong> - General duties and conduct requirements</span>
            </label>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">What are employee obligations?</span>
            </button>
            <div class="help-content">
                <p>Standard obligations include:</p>
                <ul>
                    <li>Following lawful and reasonable directions</li>
                    <li>Complying with workplace policies and procedures</li>
                    <li>Acting in good faith and in the employer's best interests</li>
                    <li>Maintaining professional conduct</li>
                    <li>Following health and safety requirements</li>
                </ul>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="conflictOfInterest" name="conflictOfInterest" 
                       ${data.conflictOfInterest ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Conflict of Interest</strong> - Disclosure of potential conflicts</span>
            </label>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">When to use a conflict of interest clause</span>
            </button>
            <div class="help-content">
                <p>A conflict of interest clause requires employees to:</p>
                <ul>
                    <li>Disclose any outside business interests</li>
                    <li>Not work for competitors during employment</li>
                    <li>Declare any personal relationships that could affect their role</li>
                    <li>Avoid situations where personal interest conflicts with business</li>
                </ul>
                <p>Particularly important for management and senior positions.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="confidentiality" name="confidentiality" 
                       ${data.confidentiality ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Confidentiality</strong> - Protection of business information</span>
            </label>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">What information is confidential?</span>
            </button>
            <div class="help-content">
                <p>Confidential information may include:</p>
                <ul>
                    <li>Business strategies and plans</li>
                    <li>Customer lists and supplier details</li>
                    <li>Recipes and menu development</li>
                    <li>Financial information</li>
                    <li>Trade secrets and proprietary processes</li>
                </ul>
                <p>This clause prevents employees from sharing this information during and after employment.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="intellectualProperty" name="intellectualProperty" 
                       ${data.intellectualProperty ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Intellectual Property</strong> - Ownership of work created during employment</span>
            </label>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">IP examples in hospitality</span>
            </button>
            <div class="help-content">
                <p>In hospitality, intellectual property might include:</p>
                <ul>
                    <li>Original recipes developed by chefs</li>
                    <li>Menu designs and concepts</li>
                    <li>Marketing materials created by staff</li>
                    <li>Photos and social media content</li>
                    <li>Training materials and procedures</li>
                </ul>
                <p>This clause ensures the business owns work created by employees during their employment.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="consultation" name="consultation" 
                       ${data.consultation ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Consultation</strong> - Process for workplace changes</span>
            </label>
        </div>
        
        <div class="help-section">
            <button class="help-toggle" onclick="toggleHelpSection(this)">
                <span class="help-toggle-icon">▶</span>
                <span class="help-toggle-text">Why consult employees?</span>
            </button>
            <div class="help-content">
                <p>When making major workplace changes, employers should consult with affected employees about:</p>
                <ul>
                    <li>Changes to rosters or working hours</li>
                    <li>Introduction of new technology</li>
                    <li>Restructuring or role changes</li>
                    <li>Workplace relocations</li>
                </ul>
                <p>Many Modern Awards require consultation processes.</p>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="disputes" name="disputes" 
                       ${data.disputes ? 'checked' : ''}>
                <span class="checkbox-text"><strong>Dispute Resolution</strong> - Process for resolving workplace disputes</span>
            </label>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Ending Employment →</button>
        </div>
    `;
}

function initializeStep5Listeners() {
    const inputs = document.querySelectorAll('#contractStepContent input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
}

// Continue with Steps 6-8 in next file...
// ========================================
// STEP 6: Ending Employment
// ========================================
function getStep6Template() {
    const data = contractBuilderState.data.step6;
    
    return `
        <h2 class="step-title">Ending Employment</h2>
        <p class="step-description">Define the notice periods and termination terms for this employment contract.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <!-- RESIGNATION NOTICE -->
        <div class="form-section">
            <h3 class="form-section-title required">Resignation notice</h3>
            <p class="form-section-description"><strong>If your employee resigns, how much notice will they need to give you?</strong></p>
            <p class="form-section-description">Insert at least the <a href="https://www.fairwork.gov.au/ending-employment/notice-and-final-pay" target="_blank" rel="noopener noreferrer">minimum notice</a> from the award. If your award isn't listed, choose 'Other' then find it in the linked list of awards. If the award doesn't have rules, consider using the same minimum notice period required for dismissals.</p>
            
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 16px 0;">
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 12px; margin-bottom: 16px;">
                    <div style="color: #212529; font-weight: 600;">Continuous employment</div>
                    <div style="color: #212529; font-weight: 600;">Minimum notice period</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 12px; margin-bottom: 12px; align-items: center;">
                    <div style="color: #495057;">1 year or less</div>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="resignYear1" name="resignYear1" 
                               value="${data.resignationNotice?.year1 || '1'}" min="1" max="12" style="width: 80px;" onchange="updateResignationClause()">
                        <span class="input-suffix">week(s)</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 12px; margin-bottom: 12px; align-items: center;">
                    <div style="color: #495057;">More than 1 year to 3 years</div>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="resignYear1to3" name="resignYear1to3" 
                               value="${data.resignationNotice?.year1to3 || '2'}" min="1" max="12" style="width: 80px;" onchange="updateResignationClause()">
                        <span class="input-suffix">week(s)</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 12px; margin-bottom: 12px; align-items: center;">
                    <div style="color: #495057;">More than 3 years to 5 years</div>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="resignYear3to5" name="resignYear3to5" 
                               value="${data.resignationNotice?.year3to5 || '3'}" min="1" max="12" style="width: 80px;" onchange="updateResignationClause()">
                        <span class="input-suffix">week(s)</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 12px; align-items: center;">
                    <div style="color: #495057;">More than 5 years</div>
                    <div class="input-with-suffix">
                        <input type="number" class="form-input" id="resignYear5plus" name="resignYear5plus" 
                               value="${data.resignationNotice?.year5plus || '4'}" min="1" max="12" style="width: 80px;" onchange="updateResignationClause()">
                        <span class="input-suffix">week(s)</span>
                    </div>
                </div>
            </div>
            
            <div class="clause-preview" id="resignationClause">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Resignation notice clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You must give us the following minimum notice periods if you resign.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #dee2e6;">
                                <th style="text-align: left; padding: 8px 0; color: #212529;">Continuous employment with us</th>
                                <th style="text-align: left; padding: 8px 0; color: #212529;">Minimum notice period</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">1 year or less</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>${data.resignationNotice?.year1 || '1'}</strong> week(s)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">More than 1 year to 3 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>${data.resignationNotice?.year1to3 || '2'}</strong> week(s)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">More than 3 years to 5 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>${data.resignationNotice?.year3to5 || '3'}</strong> week(s)</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #495057;">More than 5 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>${data.resignationNotice?.year5plus || '4'}</strong> week(s)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Notice period</span>
                </button>
                <div class="help-content">
                    <p>When an employee resigns, they have to give notice to you. The minimum notice period is the length of time they must give notice to you before they end employment.</p>
                </div>
            </div>
        </div>
        
        <!-- DISMISSAL NOTICE -->
        <div class="form-section">
            <h3 class="form-section-title">Dismissal notice</h3>
            <p class="form-section-description">If you dismiss an employee, you must provide specific minimum notice periods or the equivalent pay (unless they're in the list of employees that do not get notice). You should also <a href="https://www.fairwork.gov.au/ending-employment/notice-and-final-pay" target="_blank" rel="noopener noreferrer">check the minimum notice in the award</a> – some have longer notice periods. If your award isn't listed, choose 'Other' then find it in the linked list of awards.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Dismissal notice clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>You are entitled to the following minimum notice periods (or payment in lieu of notice) if we end your employment. This does not apply if we end your employment for serious misconduct.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #dee2e6;">
                                <th style="text-align: left; padding: 8px 0; color: #212529;">Continuous employment with us</th>
                                <th style="text-align: left; padding: 8px 0; color: #212529;">Minimum notice period</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">1 year or less</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>1 week</strong></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">More than 1 year to 3 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>2 weeks</strong></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 8px 0; color: #495057;">More than 3 years to 5 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>3 weeks</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #495057;">More than 5 years</td>
                                <td style="padding: 8px 0; color: #495057;"><strong>4 weeks</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="margin-top: 12px;">You may be entitled to a longer minimum notice period under your award.</p>
                    <p>You will get an extra week of notice if you're older than 45 years and have worked for us for at least 2 years.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Some employees do not get notice</span>
                </button>
                <div class="help-content">
                    <p>Exclusions apply. For example, employees do not get notice if their employment is terminated:</p>
                    <ul>
                        <li>for serious misconduct</li>
                        <li>if they're a casual employee</li>
                        <li>if they're employed for a specified period of time, task, or season</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- REDUNDANCY -->
        <div class="form-section">
            <h3 class="form-section-title">Redundancy</h3>
            <p class="form-section-description">Redundancy can occur when you either no longer need an employee's job to be done by anyone (e.g. you get technology that replaces the job), or you become insolvent or bankrupt.</p>
            
            <div class="clause-preview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Redundancy clause</span>
                    <span class="clause-badge included">Included</span>
                </div>
                <div class="clause-content">
                    <p>If your position is terminated due to redundancy, any notice and redundancy pay entitlements will be in accordance with the National Employment Standards and your award.</p>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Redundancy pay</span>
                </button>
                <div class="help-content">
                    <p>When an employee's job is made redundant, you may have to provide redundancy pay if:</p>
                    <ul>
                        <li>the employee has at least 12 months continuous service</li>
                        <li>your business has 15 or more employees</li>
                    </ul>
                    <p>The amount depends on the employee's years of service.</p>
                </div>
            </div>
        </div>
        
        <!-- MISCONDUCT (Optional) -->
        <div class="form-section">
            <h3 class="form-section-title">Misconduct</h3>
            <p class="form-section-description">This sets out that you can dismiss (fire) the employee for serious misconduct without notice.</p>
            
            <div class="optional-clause-toggle">
                <label class="checkbox-label">
                    <input type="checkbox" class="checkbox-input" id="misconductClause" name="misconductClause" 
                           ${data.misconductClause ? 'checked' : ''} onchange="toggleClauseVisibility('misconductClausePreview', this.checked)">
                    <span class="checkbox-text">Include Misconduct clause (optional)</span>
                </label>
            </div>
            
            <div class="clause-preview ${data.misconductClause ? '' : 'collapsed'}" id="misconductClausePreview">
                <div class="clause-header">
                    <span class="clause-icon">📋</span>
                    <span class="clause-title">Misconduct clause</span>
                    <span class="clause-badge optional">Optional to include</span>
                </div>
                <div class="clause-content">
                    <p>We may terminate your employment without notice, or payment in lieu of notice, if you engage in serious misconduct.</p>
                    <p>Serious misconduct is when an employee:</p>
                    <ul>
                        <li>causes serious and imminent risk to the health and safety of another person or to the reputation, viability or profits of their employer's business, or</li>
                        <li>wilfully or deliberately behaves in a way that's inconsistent with continuing their employment.</li>
                    </ul>
                    <p>Examples of serious misconduct include:</p>
                    <ul>
                        <li>theft</li>
                        <li>fraud</li>
                        <li>violence/assault</li>
                        <li>sexual harassment</li>
                        <li>serious breaches of health and safety requirements</li>
                        <li>being drunk or affected by drugs at work</li>
                        <li>refusing to carry out work duties.</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-section">
                <button class="help-toggle" onclick="toggleHelpSection(this)">
                    <span class="help-toggle-icon">▶</span>
                    <span class="help-toggle-text">Serious misconduct</span>
                </button>
                <div class="help-content">
                    <p>To dismiss an employee without notice, you must believe that their conduct is serious enough to justify immediate dismissal.</p>
                    <p>It's a good idea to document the misconduct, in case your employee makes an unfair dismissal claim. Be careful dismissing an employee this way. If the dismissal is found to be unfair, you may have to pay compensation, lost wages and/or give the employee their job back.</p>
                    <p><a href="https://www.fairwork.gov.au/ending-employment/dismissal/misconduct-and-serious-misconduct" target="_blank" rel="noopener noreferrer">Check the Fair Work Ombudsman's website for more information on serious misconduct</a>.</p>
                </div>
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-secondary" onclick="saveContractProgress()">💾 Save Progress</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Review Contract →</button>
        </div>
    `;
}

function updateResignationClause() {
    const year1 = document.getElementById('resignYear1')?.value || '1';
    const year1to3 = document.getElementById('resignYear1to3')?.value || '2';
    const year3to5 = document.getElementById('resignYear3to5')?.value || '3';
    const year5plus = document.getElementById('resignYear5plus')?.value || '4';
    
    const clause = document.getElementById('resignationClause');
    if (clause) {
        const clauseContent = clause.querySelector('.clause-content');
        if (clauseContent) {
            clauseContent.innerHTML = `
                <p>You must give us the following minimum notice periods if you resign.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #dee2e6;">
                            <th style="text-align: left; padding: 8px 0; color: #212529;">Continuous employment with us</th>
                            <th style="text-align: left; padding: 8px 0; color: #212529;">Minimum notice period</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 8px 0; color: #495057;">1 year or less</td>
                            <td style="padding: 8px 0; color: #495057;"><strong>${year1}</strong> week(s)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 8px 0; color: #495057;">More than 1 year to 3 years</td>
                            <td style="padding: 8px 0; color: #495057;"><strong>${year1to3}</strong> week(s)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 8px 0; color: #495057;">More than 3 years to 5 years</td>
                            <td style="padding: 8px 0; color: #495057;"><strong>${year3to5}</strong> week(s)</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #495057;">More than 5 years</td>
                            <td style="padding: 8px 0; color: #495057;"><strong>${year5plus}</strong> week(s)</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    }
    
    saveCurrentStepData();
}

function initializeStep6Listeners() {
    const inputs = document.querySelectorAll('#contractStepContent input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveCurrentStepData();
        });
    });
}

// ========================================
// STEP 7: Review Contract
// ========================================
function getStep7Template() {
    const data = contractBuilderState.data;
    
    // Build summary of all selections
    let summary = `
        <h2 class="step-title">Review Your Contract</h2>
        <p class="step-description">Review all the information you've entered. Click any section to edit.</p>
        <p style="color: #dc3545; font-size: 13px; margin-bottom: 20px;"><span style="font-weight: bold;">*</span> Required fields</p>
        
        <div class="warning-box">
            <div class="warning-box-content">
                <p><strong>Important:</strong> Please review all details carefully before generating the contract. You can click on any section below to go back and make changes.</p>
            </div>
        </div>
    `;
    
    // Step 1: Position Details
    summary += `
        <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Position Details</h3>
                <button class="btn btn-link" onclick="jumpToContractStep(1)" style="padding: 8px 16px;">Edit</button>
            </div>
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 12px; color: #495057;">
                <div style="font-weight: 600;">Position:</div>
                <div>${data.step1.positionTitle || '<em>Not provided</em>'}</div>
                
                <div style="font-weight: 600;">Award:</div>
                <div>${data.step1.awardName || '<em>Not provided</em>'}</div>
                
                <div style="font-weight: 600;">Employment Type:</div>
                <div>${formatEmploymentType(data.step1.employmentType)}</div>
                
                <div style="font-weight: 600;">Start Date:</div>
                <div>${data.step1.startDate || '<em>Not provided</em>'}</div>
                
                ${data.step1.hasProbation ? `
                <div style="font-weight: 600;">Probation:</div>
                <div>${data.step1.probationLength} months</div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Step 2: Hours
    if (data.step1.employmentType !== 'casual') {
        summary += `
            <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Hours & Work Pattern</h3>
                    <button class="btn btn-link" onclick="jumpToContractStep(2)" style="padding: 8px 16px;">Edit</button>
                </div>
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 12px; color: #495057;">
                    <div style="font-weight: 600;">Hours Per Week:</div>
                    <div>${data.step2.hoursPerWeek || '<em>Not provided</em>'} hours</div>
                    
                    <div style="font-weight: 600;">Work Pattern:</div>
                    <div>${data.step2.workPattern || '<em>Not provided</em>'}</div>
                </div>
            </div>
        `;
    }
    
    // Step 3: Pay
    summary += `
        <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Pay & Conditions</h3>
                <button class="btn btn-link" onclick="jumpToContractStep(3)" style="padding: 8px 16px;">Edit</button>
            </div>
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 12px; color: #495057;">
                <div style="font-weight: 600;">Pay Rate:</div>
                <div>$${data.step3.payRate || '0.00'} per ${data.step3.payRateType === 'weekly' ? 'week' : 'hour'}</div>
                
                <div style="font-weight: 600;">Pay Frequency:</div>
                <div>${formatPayFrequency(data.step3.payFrequency)}</div>
                
                <div style="font-weight: 600;">Payment Method:</div>
                <div>${data.step3.payMethod === 'bank' ? 'Bank account' : data.step3.payMethod === 'cash' ? 'Cash' : 'Cheque'}</div>
                
                <div style="font-weight: 600;">Superannuation:</div>
                <div>Included (as per legislation)</div>
                
                ${data.step3.additionalSuper ? `
                <div style="font-weight: 600;">Additional Super:</div>
                <div>${data.step3.additionalSuperPercent || '0'}%</div>
                ` : ''}
                
                ${data.step3.penaltyRatesOvertime ? `
                <div style="font-weight: 600;">Penalty Rates/Overtime:</div>
                <div>Clause included</div>
                ` : ''}
                
                ${data.step3.allowances ? `
                <div style="font-weight: 600;">Allowances:</div>
                <div>Clause included</div>
                ` : ''}
                
                ${data.step3.commission ? `
                <div style="font-weight: 600;">Commission:</div>
                <div>Clause included</div>
                ` : ''}
                
                ${data.step3.annualBonus ? `
                <div style="font-weight: 600;">Annual Bonus:</div>
                <div>Clause included</div>
                ` : ''}
                
                ${data.step3.annualPayReview ? `
                <div style="font-weight: 600;">Annual Pay Review:</div>
                <div>Clause included</div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Step 4: Leave
    const empTypeForLeave = data.step1.employmentType;
    const leaveItems = [];
    
    if (empTypeForLeave !== 'casual') {
        leaveItems.push(`Annual Leave (${data.step4.annualLeaveAmount || '4'} ${data.step4.annualLeaveMeasure || 'week'}s per year)`);
        leaveItems.push('Personal/Carer\'s Leave (10 days per year)');
    }
    leaveItems.push('Parental Leave (12 months unpaid)');
    if (data.step4.additionalParentalLeave) {
        leaveItems.push(`Additional Parental Leave (${data.step4.additionalParentalLeaveWeeks || '0'} weeks paid)`);
    }
    leaveItems.push('Compassionate Leave (2 days per occasion)');
    leaveItems.push('Community Service Leave');
    leaveItems.push('Family and Domestic Violence Leave (10 days per year)');
    leaveItems.push('Public Holidays');
    leaveItems.push('Long Service Leave (as per state legislation)');
    
    summary += `
        <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Leave Entitlements</h3>
                <button class="btn btn-link" onclick="jumpToContractStep(4)" style="padding: 8px 16px;">Edit</button>
            </div>
            <div style="color: #495057;">
                ${leaveItems.map(item => `
                    <div style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">✓ ${item}</div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Step 5: Additional Terms
    const termItems = [];
    if (data.step5.employeeObligations) termItems.push('Employee Obligations');
    if (data.step5.conflictOfInterest) termItems.push('Conflict of Interest');
    if (data.step5.confidentiality) termItems.push('Confidentiality');
    if (data.step5.intellectualProperty) termItems.push('Intellectual Property');
    if (data.step5.consultation) termItems.push('Consultation');
    if (data.step5.disputes) termItems.push('Dispute Resolution');
    
    summary += `
        <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Additional Terms</h3>
                <button class="btn btn-link" onclick="jumpToContractStep(5)" style="padding: 8px 16px;">Edit</button>
            </div>
            <div style="color: #495057;">
                ${termItems.length > 0 ? termItems.map(item => `
                    <div style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">✓ ${item}</div>
                `).join('') : '<em>No additional terms selected</em>'}
            </div>
        </div>
    `;
    
    // Step 6: Ending Employment
    const resignNotice = data.step6.resignationNotice || { year1: '1', year1to3: '2', year3to5: '3', year5plus: '4' };
    summary += `
        <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #212529; font-size: 20px; font-weight: 700; margin: 0;">Ending Employment</h3>
                <button class="btn btn-link" onclick="jumpToContractStep(6)" style="padding: 8px 16px;">Edit</button>
            </div>
            <div style="color: #495057;">
                <div style="font-weight: 600; margin-bottom: 8px;">Resignation Notice Periods:</div>
                <div style="padding: 4px 0;">1 year or less: ${resignNotice.year1} week(s)</div>
                <div style="padding: 4px 0;">1-3 years: ${resignNotice.year1to3} week(s)</div>
                <div style="padding: 4px 0;">3-5 years: ${resignNotice.year3to5} week(s)</div>
                <div style="padding: 4px 0;">5+ years: ${resignNotice.year5plus} week(s)</div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #dee2e6;">✓ Dismissal notice clause included (NES minimum)</div>
                <div style="padding: 4px 0;">✓ Redundancy clause included</div>
                ${data.step6.misconductClause ? '<div style="padding: 4px 0;">✓ Misconduct clause included</div>' : ''}
            </div>
        </div>
    `;
    
    summary += `
        <div class="form-group" style="margin-top: 32px;">
            <label class="checkbox-label">
                <input type="checkbox" class="checkbox-input" id="reviewComplete" name="reviewComplete">
                <span class="checkbox-text">
                    <strong>I have reviewed all sections and confirm the information is correct.</strong> <span style="color: #dc3545; font-weight: bold;">*</span>
                </span>
            </label>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="previousContractStep()">← Back</button>
            <button class="btn btn-primary" onclick="nextContractStep()">Next: Generate Contract →</button>
        </div>
    `;
    
    return summary;
}

function initializeStep7Listeners() {
    document.getElementById('reviewComplete').addEventListener('change', (e) => {
        contractBuilderState.data.step7.reviewComplete = e.target.checked;
    });
}

// Helper formatters
function formatEmploymentType(type) {
    const types = {
        'full-time': 'Full-time (38 hours per week)',
        'part-time': 'Part-time (Regular hours)',
        'casual': 'Casual (As required)'
    };
    return types[type] || type;
}

function formatPayFrequency(freq) {
    const frequencies = {
        'weekly': 'Weekly',
        'fortnightly': 'Fortnightly',
        'monthly': 'Monthly'
    };
    return frequencies[freq] || freq;
}

// ========================================
// STEP 8: Generate & Download
// ========================================
function getStep8Template() {
    return `
        <h2 class="step-title">🎉 Contract Ready to Generate</h2>
        <p class="step-description">Your employment contract is ready. Choose how you'd like to receive it.</p>
        
        <div class="warning-box">
            <div class="warning-box-title">⚠️ Final Reminder</div>
            <div class="warning-box-content">
                <p><strong>This is a template contract - NOT legal advice.</strong></p>
                <ul>
                    <li>Have this contract reviewed by a legal professional before use</li>
                    <li>Ensure it complies with your specific Modern Award</li>
                    <li>Consider consulting with Fitz HR's Senior Consultant</li>
                    <li>Provide the Fair Work Information Statement to new employees</li>
                </ul>
            </div>
        </div>
        
        <div style="background: #e7f3ff; border: 2px solid #007bff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #004085; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Next Steps After Generating</h3>
            <div style="color: #004085;">
                <ol style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Review the contract with a legal professional</li>
                    <li style="margin-bottom: 8px;">Customize any sections specific to your business</li>
                    <li style="margin-bottom: 8px;">Have both parties sign the contract</li>
                    <li style="margin-bottom: 8px;">Provide employee with Fair Work Information Statement</li>
                    <li style="margin-bottom: 8px;">Keep a signed copy for your records</li>
                </ol>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Download Format</label>
            <div class="radio-group">
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="deliveryMethod" value="docx" checked>
                        <div class="radio-content">
                            <div class="radio-text">📄 Word Document (.docx)</div>
                            <div class="radio-description">Editable format - recommended</div>
                        </div>
                    </label>
                </div>
                <div class="radio-option">
                    <label class="radio-label">
                        <input type="radio" class="radio-input" name="deliveryMethod" value="pdf">
                        <div class="radio-content">
                            <div class="radio-text">📑 PDF Document</div>
                            <div class="radio-description">Read-only format</div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #856404; font-size: 14px;">
                <strong>Remember:</strong> Don't reuse this contract for different employees. Each employee should have their own tailored contract based on their specific role and circumstances.
            </div>
        </div>
        
        <div class="btn-container">
            <button class="btn btn-secondary" onclick="jumpToContractStep(7)">← Back to Review</button>
            <button class="btn btn-primary" onclick="generateEmploymentContract()" style="font-size: 18px; padding: 16px 48px;">
                📥 Generate Contract
            </button>
        </div>
    `;
}

function initializeStep8Listeners() {
    // Nothing special needed for step 8
}

// ========================================
// DOCUMENT GENERATION
// ========================================
async function generateEmploymentContract() {
    // Show loading overlay
    showContractLoading('Generating your employment contract preview...');
    
    try {
        // Build the contract content
        const contractHTML = buildContractHTML();
        
        // Hide loading
        hideContractLoading();
        
        // Store the generated document for later download
        documentBuilderState.generatedDocument = contractHTML;
        documentBuilderState.currentType = 'employmentContract';
        
        // CRITICAL: Store contract data for review request pre-population
        lastGeneratedDocumentData = { 
            ...contractBuilderState.data,
            employeeName: contractBuilderState.data?.employeeName || '',
            position: contractBuilderState.data?.position || contractBuilderState.data?.jobTitle || '',
            role: contractBuilderState.data?.position || contractBuilderState.data?.jobTitle || ''
        };
        console.log('📋 Preserved Employment Contract data:', lastGeneratedDocumentData);
        
        // CRITICAL: Hide the Employment Contract Builder (it has z-index: 999999)
        const contractBuilder = document.getElementById('employmentContractBuilder');
        if (contractBuilder) {
            contractBuilder.classList.remove('active');
            contractBuilder.style.display = 'none';
        }
        
        // Show in preview modal (like other documents)
        const previewContent = document.getElementById('documentPreviewContent');
        if (previewContent) {
            // Convert contract HTML to display format
            previewContent.innerHTML = contractHTML;
        }
        
        // Store docType in the preview modal
        const previewModal = document.getElementById('documentPreviewModal');
        if (previewModal) {
            previewModal.dataset.docType = 'employmentContract';
            previewModal.dataset.docName = 'Employment Contract';
        }
        
        // Show the preview modal
        document.getElementById('documentPreviewModal').classList.remove('hidden');
        
        // Apply blur with formal_process unlock flow (2 credits required)
        setTimeout(() => {
            applyDocumentBlur('employmentContract', 'Employment Contract');
        }, 100);
        
    } catch (error) {
        hideContractLoading();
        showAlert('Failed to generate contract preview. Please try again.');
        console.error('Contract generation error:', error);
    }
}

async function generateEmploymentContractUnlocked() {
    const format = document.querySelector('input[name="deliveryMethod"]:checked')?.value || 'docx';
    
    // Show loading overlay
    showContractLoading('Generating your employment contract...');
    
    try {
        // Build the contract content
        const contractHTML = buildContractHTML();
        
        if (format === 'docx') {
            // Generate Word document using html-docx-js
            await generateContractWordDocument(contractHTML);
        } else {
            // Generate PDF
            await generateContractPDFDocument(contractHTML);
        }
        
        // Mark as saved
        contractBuilderState.unsavedChanges = false;
        
        // Show success message
        hideContractLoading();
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Contract generated successfully!', 'success');
        }
        
        // Prompt for onboarding checklist after a moment
        setTimeout(() => {
            promptForOnboardingChecklist();
        }, 1000);
        
    } catch (error) {
        hideContractLoading();
        showAlert('Failed to generate contract. Please try again.');
    }
}


function buildContractHTML() {
    const data = contractBuilderState.data;
    const today = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
                h1 { color: #2c3e50; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 30px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
                h3 { color: #667eea; margin-top: 20px; }
                .clause { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #667eea; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                td, th { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #667eea; color: white; }
                .signature-section { margin-top: 50px; }
                .signature-line { border-top: 1px solid #000; width: 300px; margin-top: 50px; }
            </style>
        </head>
        <body>
            <h1>EMPLOYMENT CONTRACT</h1>
            
            <div class="warning">
                <strong>IMPORTANT LEGAL NOTICE:</strong> This contract has been generated using the Fitz HR Employment Contract Builder.
                This is a template document and should be reviewed by a legal professional before use. It is based on Fair Work Australia
                requirements but may need customization for your specific circumstances.
            </div>
            
            <h2>1. PARTIES</h2>
            <div class="clause">
                <p><strong>Employer:</strong> [EMPLOYER NAME] (ABN: [ABN NUMBER])</p>
                <p><strong>Address:</strong> ${data.step1.workplaceAddress || '[WORKPLACE ADDRESS]'}</p>
                <p><strong>Employee:</strong> [EMPLOYEE NAME]</p>
                <p><strong>Address:</strong> [EMPLOYEE ADDRESS]</p>
            </div>
            
            <h2>2. POSITION AND DUTIES</h2>
            <div class="clause">
                <h3>2.1 Position Title</h3>
                <p>The Employee is employed in the position of <strong>${data.step1.positionTitle}</strong>.</p>
                
                <h3>2.2 Duties and Responsibilities</h3>
                ${data.step1.dutiesOption === 'outline' && data.step1.duties ? `
                    <p>${data.step1.duties.replace(/\n/g, '<br>')}</p>
                ` : `
                    <p>The Employee's duties and responsibilities are as outlined in the Position Description attached to this contract.</p>
                `}
                
                <h3>2.3 Modern Award</h3>
                <p>This employment is covered by the <strong>${data.step1.awardName}</strong>.</p>
            </div>
            
            <h2>3. EMPLOYMENT TYPE AND COMMENCEMENT</h2>
            <div class="clause">
                <h3>3.1 Employment Type</h3>
                <p>The Employee is engaged on a <strong>${data.step1.employmentType}</strong> basis${data.step1.isPermanent ? ' on an ongoing/permanent basis' : ' for a fixed term'}.</p>
                
                <h3>3.2 Commencement Date</h3>
                <p>Employment will commence on <strong>${data.step1.startDate}</strong>.</p>
                
                ${!data.step1.isPermanent && data.step1.endDate ? `
                    <h3>3.3 End Date</h3>
                    <p>This fixed-term employment will end on <strong>${data.step1.endDate}</strong> unless terminated earlier in accordance with this contract.</p>
                ` : ''}
                
                ${data.step1.hasProbation ? `
                    <h3>3.4 Probation Period</h3>
                    <p>The first <strong>${data.step1.probationLength} months</strong> of employment will be a probation period. During this time, either party may terminate employment with one week's notice.</p>
                ` : ''}
            </div>
            
            ${data.step1.employmentType !== 'casual' ? `
            <h2>4. HOURS OF WORK</h2>
            <div class="clause">
                <h3>4.1 Ordinary Hours</h3>
                <p>The Employee's ordinary hours of work are <strong>${data.step2.hoursPerWeek} hours per week</strong>.</p>
                
                ${data.step2.workPattern ? `
                    <h3>4.2 Work Pattern</h3>
                    <p>${data.step2.workPattern}</p>
                ` : ''}
                
                ${data.step2.overtimeApplies ? `
                    <h3>4.3 Reasonable Additional Hours</h3>
                    <p>The Employee may be required to work reasonable additional hours as necessary for the proper performance of their duties. Overtime will be compensated in accordance with the applicable Modern Award.</p>
                ` : ''}
            </div>
            ` : `
            <h2>4. CASUAL EMPLOYMENT</h2>
            <div class="clause">
                <p>As a casual employee, the Employee has no guaranteed hours of work. Hours will be offered as required by the business and may be accepted or declined by the Employee.</p>
            </div>
            `}
            
            <h2>5. REMUNERATION</h2>
            <div class="clause">
                <h3>5.1 Pay Rate</h3>
                <p>The Employee will be paid <strong>$${data.step3.payRate} per ${data.step3.payRateType === 'weekly' ? 'week' : 'hour'}</strong>${data.step1.employmentType === 'casual' ? ' (including 25% casual loading)' : ''}. This pay rate does not include superannuation, which will be paid separately.</p>
                
                <h3>5.2 Payment Method</h3>
                <p>The Employee will be paid <strong>${data.step3.payFrequency}</strong> ${data.step3.payMethod === 'bank' ? 'into the Employee\'s nominated bank account' : data.step3.payMethod === 'cash' ? 'in cash' : 'by cheque'}.</p>
                
                <h3>5.3 Superannuation</h3>
                <p>If the Employee is eligible for the super guarantee (SG), the Employer will pay the contributions on the Employee's behalf in accordance with legislation and the applicable award. The Employer will pay contributions into a super fund of the Employee's choice.</p>
                <p>If the Employee does not advise their choice of fund, the Employer may need to contact the ATO to find out if the Employee has a 'stapled' super fund to make SG contributions into.</p>
                <p>If the Employee does not advise their choice of fund and the ATO confirms there is no stapled super fund, the Employer will pay SG contributions to the default fund or another fund that meets the choice of fund rules.</p>
                
                ${data.step3.additionalSuper ? `
                <h3>5.4 Additional Superannuation</h3>
                <p>In addition to the SG, the Employer will contribute <strong>${data.step3.additionalSuperPercent || '0'} percent</strong> of the Employee's base salary into superannuation.</p>
                ` : ''}
                
                ${data.step3.penaltyRatesOvertime ? `
                <h3>${data.step3.additionalSuper ? '5.5' : '5.4'} Penalty Rates and Overtime</h3>
                <p>The Employee may be entitled to overtime rates under the applicable award if they work:</p>
                <ul>
                    <li>more than their ordinary hours of work</li>
                    <li>outside the spread of ordinary hours.</li>
                </ul>
                <p>The Employee may be entitled to penalty rates or shift loadings according to the award if they work:</p>
                <ul>
                    <li>on a weekend</li>
                    <li>on a public holiday</li>
                    <li>late night or early morning shifts.</li>
                </ul>
                ` : ''}
                
                ${data.step3.allowances ? `
                <h3>${data.step3.additionalSuper && data.step3.penaltyRatesOvertime ? '5.6' : data.step3.additionalSuper || data.step3.penaltyRatesOvertime ? '5.5' : '5.4'} Allowances</h3>
                <p>The Employee may be entitled to allowances in accordance with the applicable award, for example, if they:</p>
                <ul>
                    <li>do certain tasks or are required to use a particular skill in the duties of their role</li>
                    <li>have to use their own tools at work</li>
                    <li>work in particular conditions, environments or in remote locations.</li>
                </ul>
                ` : ''}
                
                ${data.step3.commission ? `
                <h3>Commission</h3>
                <p>In addition to the base pay, the Employer will pay the Employee commission under the following arrangement:</p>
                <p><em>${data.step3.commissionArrangement || '[Commission arrangement to be specified]'}</em></p>
                <p>If the parties agree to change this commission arrangement during the employment, this employment contract will be updated. Any changes to the commission arrangement will be made according to the requirements of the modern award which applies to the Employee.</p>
                ` : ''}
                
                ${data.step3.annualBonus ? `
                <h3>Annual Bonus</h3>
                <p>The Employer may pay the Employee an annual bonus at its discretion, taking into consideration the Employee's performance and other relevant business factors.</p>
                <p>There is no guarantee that the Employee will receive a bonus, and the Employee will not be eligible for one after their employment ends.</p>
                ` : ''}
                
                ${data.step3.annualPayReview ? `
                <h3>Annual Pay Review</h3>
                <p>The Employer will review the Employee's pay annually to determine whether they are eligible for an increase, taking into consideration:</p>
                <ul>
                    <li>the Employee's performance</li>
                    <li>the business's financial position.</li>
                </ul>
                <p>Any increase in pay, above award entitlements, is at the Employer's discretion.</p>
                ` : ''}
            </div>
            
            ${data.step1.employmentType !== 'casual' ? generateLeaveSection(data.step4) : ''}
            ${generateAdditionalTermsSection(data.step5)}
            ${generateNoticeSection(data.step6)}
            
            <h2>SIGNATURES</h2>
            <div class="signature-section">
                <p><strong>EMPLOYER</strong></p>
                <p>Signed: _________________________________</p>
                <p>Name: _________________________________</p>
                <p>Position: _________________________________</p>
                <p>Date: _________________________________</p>
                
                <div style="margin-top: 40px;"></div>
                
                <p><strong>EMPLOYEE</strong></p>
                <p>Signed: _________________________________</p>
                <p>Name: _________________________________</p>
                <p>Date: _________________________________</p>
            </div>
            
            <div class="warning" style="margin-top: 40px;">
                <p><strong>IMPORTANT:</strong> Both parties should retain a signed copy of this contract. The Employee must be provided with the Fair Work Information Statement.</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #6c757d; font-size: 12px;">
                <p>Generated by Fitz HR Employment Contract Builder on ${today}</p>
                <p>This is a template document - seek legal advice before use</p>
            </div>
        </body>
        <!--/email_off-->
</html>
    `;
    
    return html;
}

function generateLeaveSection(leaveData) {
    const empType = contractBuilderState.data.step1.employmentType;
    let html = '<h2>6. LEAVE ENTITLEMENTS</h2><div class="clause">';
    let clauseNum = 1;
    
    // Annual Leave (not for casuals)
    if (empType !== 'casual') {
        html += `
            <h3>6.${clauseNum} Annual Leave</h3>
            <p>The Employee is entitled to <strong>${leaveData.annualLeaveAmount || '4'} ${leaveData.annualLeaveMeasure || 'week'}(s)</strong> of annual leave each year, based on their ordinary hours of work per week.</p>
            <p>The Employer will provide any applicable annual leave loading entitlements in accordance with the applicable award.</p>
            <p>Annual leave accumulates during the year. Any unused annual leave will roll over from year to year.</p>
        `;
        clauseNum++;
    }
    
    // Parental Leave
    html += `
        <h3>6.${clauseNum} Parental Leave</h3>
        <p>After the Employee has been working for the Employer for 12 months or more, they may be entitled to take unpaid parental leave from their position for 12 months.</p>
        <p>The Employee may also:</p>
        <ul>
            <li>request up to an extra 12 months of unpaid parental leave</li>
            <li>be entitled to Parental Leave Pay from the Australian Government, administered by Services Australia.</li>
        </ul>
    `;
    clauseNum++;
    
    // Additional Parental Leave (if selected)
    if (leaveData.additionalParentalLeave && leaveData.additionalParentalLeaveWeeks) {
        html += `
            <h3>6.${clauseNum} Additional Parental Leave</h3>
            <p>In addition to the above parental leave, the Employer will provide the Employee with <strong>${leaveData.additionalParentalLeaveWeeks} week(s)</strong> paid parental leave.</p>
        `;
        clauseNum++;
    }
    
    // Personal/Carer's Leave (not for casuals)
    if (empType !== 'casual') {
        html += `
            <h3>6.${clauseNum} Personal/Carer's Leave</h3>
            <p>The Employee is entitled to accrue 10 days paid personal/carer's leave (pro-rata for part-time employees) per year based on their ordinary hours of work. This is calculated as 1/26 of their ordinary hours of work in a year.</p>
            <p>The Employee can take personal/carer's leave when they can't work because they are sick or injured. They can also use it to care for a member of their immediate family or household who requires care or support because of:</p>
            <ul>
                <li>personal injury</li>
                <li>personal illness</li>
                <li>an unexpected emergency.</li>
            </ul>
            <p>Personal/carer's leave accrues throughout the year and from year to year. The Employee must give notice as soon as possible to take personal/carer's leave. The Employer may require evidence (such as a medical certificate).</p>
            <p>The Employee is also entitled to 2 days unpaid carer's leave (in accordance with the National Employment Standards). This is available each time an immediate family member or household member needs care or support.</p>
        `;
        clauseNum++;
    }
    
    // Compassionate Leave
    html += `
        <h3>6.${clauseNum} Compassionate Leave</h3>
        <p>The Employee is entitled to 2 days ${empType === 'casual' ? 'unpaid' : 'paid'} compassionate leave (in accordance with the National Employment Standards) each time:</p>
        <ul>
            <li>a member of their immediate family or household dies, or contracts or develops a life threatening illness or injury</li>
            <li>a child is stillborn, that would have been a member of their immediate family or household if born alive</li>
            <li>they or their current spouse or de facto partner has a miscarriage.</li>
        </ul>
    `;
    clauseNum++;
    
    // Community Service Leave
    html += `
        <h3>6.${clauseNum} Community Service Leave</h3>
        <p>The Employee may be entitled to community service leave (in accordance with the National Employment Standards) for certain activities such as:</p>
        <ul>
            <li>voluntary emergency management activities</li>
            <li>jury duty and jury selection.</li>
        </ul>
        <p>The Employee must give the Employer:</p>
        <ul>
            <li>notice of their leave as soon as possible</li>
            <li>details of the period, or expected period, that they will be away from work.</li>
        </ul>
        <p>The Employer may ask for evidence that community service leave is required.</p>
    `;
    clauseNum++;
    
    // Family and Domestic Violence Leave
    html += `
        <h3>6.${clauseNum} Family and Domestic Violence Leave</h3>
        <p>The Employee may be entitled to 10 days of paid family and domestic violence leave (in accordance with the National Employment Standards) each 12 month period.</p>
    `;
    clauseNum++;
    
    // Public Holidays
    html += `
        <h3>6.${clauseNum} Public Holidays</h3>
        <p>The Employee has a right to be absent from work on a public holiday.</p>
        <p>The Employer may ask the Employee to work on a public holiday. The Employee may refuse the request to work (in accordance with the Fair Work Act 2009) if:</p>
        <ul>
            <li>their refusal is reasonable, or</li>
            <li>the Employer's request is unreasonable.</li>
        </ul>
        <p>If the Employee works on a public holiday, they are entitled to any additional entitlements under the applicable award, such as public holiday penalty rates.</p>
        <p>If the Employee does not work on a public holiday, and it falls on a day they would normally work, they are entitled to be paid their base rate of pay for their ordinary hours of work on that day.</p>
    `;
    clauseNum++;
    
    // Long Service Leave
    html += `
        <h3>6.${clauseNum} Long Service Leave</h3>
        <p>The Employee may be entitled to long service leave after working with the Employer for a specific period of time in accordance with relevant state or territory legislation or the Fair Work Act.</p>
    `;
    
    html += '</div>';
    return html;
}

function generateAdditionalTermsSection(termsData) {
    if (!Object.values(termsData).some(v => v)) {
        return '';
    }
    
    let html = '<h2>7. ADDITIONAL TERMS AND OBLIGATIONS</h2><div class="clause">';
    let clauseNum = 1;
    
    if (termsData.employeeObligations) {
        html += `
            <h3>7.${clauseNum} Employee Obligations</h3>
            <p>The Employee must:</p>
            <ul>
                <li>Comply with all lawful and reasonable directions of the Employer</li>
                <li>Follow all workplace policies and procedures</li>
                <li>Act in good faith and in the best interests of the Employer</li>
                <li>Maintain professional standards of conduct</li>
            </ul>
        `;
        clauseNum++;
    }
    
    if (termsData.conflictOfInterest) {
        html += `
            <h3>7.${clauseNum} Conflict of Interest</h3>
            <p>The Employee must disclose any actual or potential conflicts of interest and must not engage in any activity that competes with or is detrimental to the Employer's business interests.</p>
        `;
        clauseNum++;
    }
    
    if (termsData.confidentiality) {
        html += `
            <h3>7.${clauseNum} Confidentiality</h3>
            <p>The Employee must keep confidential all information relating to the Employer's business, including but not limited to business strategies, customer information, recipes, financial information, and trade secrets. This obligation continues after the end of employment.</p>
        `;
        clauseNum++;
    }
    
    if (termsData.intellectualProperty) {
        html += `
            <h3>7.${clauseNum} Intellectual Property</h3>
            <p>All intellectual property created by the Employee during their employment, including recipes, designs, marketing materials, and other creative works, belongs to the Employer.</p>
        `;
        clauseNum++;
    }
    
    if (termsData.consultation) {
        html += `
            <h3>7.${clauseNum} Consultation</h3>
            <p>The Employer will consult with affected employees about major workplace changes in accordance with the requirements of the applicable Modern Award.</p>
        `;
        clauseNum++;
    }
    
    if (termsData.disputes) {
        html += `
            <h3>7.${clauseNum} Dispute Resolution</h3>
            <p>Any disputes arising under this contract will be dealt with in accordance with the dispute resolution procedures set out in the applicable Modern Award and the Fair Work Act 2009.</p>
        `;
        clauseNum++;
    }
    
    html += '</div>';
    return html;
}

function generateNoticeSection(noticeData) {
    const resignNotice = noticeData.resignationNotice || { year1: '1', year1to3: '2', year3to5: '3', year5plus: '4' };
    
    let html = `
        <h2>8. TERMINATION OF EMPLOYMENT</h2>
        <div class="clause">
            <h3>8.1 Resignation Notice</h3>
            <p>The Employee must give the Employer the following minimum notice periods if they resign:</p>
            <table>
                <tr>
                    <th>Continuous employment with the Employer</th>
                    <th>Minimum notice period</th>
                </tr>
                <tr>
                    <td>1 year or less</td>
                    <td>${resignNotice.year1} week(s)</td>
                </tr>
                <tr>
                    <td>More than 1 year to 3 years</td>
                    <td>${resignNotice.year1to3} week(s)</td>
                </tr>
                <tr>
                    <td>More than 3 years to 5 years</td>
                    <td>${resignNotice.year3to5} week(s)</td>
                </tr>
                <tr>
                    <td>More than 5 years</td>
                    <td>${resignNotice.year5plus} week(s)</td>
                </tr>
            </table>
            
            <h3>8.2 Dismissal Notice</h3>
            <p>The Employee is entitled to the following minimum notice periods (or payment in lieu of notice) if the Employer ends their employment. This does not apply if the Employer ends the Employee's employment for serious misconduct.</p>
            <table>
                <tr>
                    <th>Continuous employment with the Employer</th>
                    <th>Minimum notice period</th>
                </tr>
                <tr>
                    <td>1 year or less</td>
                    <td>1 week</td>
                </tr>
                <tr>
                    <td>More than 1 year to 3 years</td>
                    <td>2 weeks</td>
                </tr>
                <tr>
                    <td>More than 3 years to 5 years</td>
                    <td>3 weeks</td>
                </tr>
                <tr>
                    <td>More than 5 years</td>
                    <td>4 weeks</td>
                </tr>
            </table>
            <p>The Employee may be entitled to a longer minimum notice period under their award.</p>
            <p>The Employee will get an extra week of notice if they are older than 45 years and have worked for the Employer for at least 2 years.</p>
            
            <h3>8.3 Redundancy</h3>
            <p>If the Employee's position is terminated due to redundancy, any notice and redundancy pay entitlements will be in accordance with the National Employment Standards and the applicable award.</p>
            
            ${noticeData.misconductClause ? `
                <h3>8.4 Misconduct</h3>
                <p>The Employer may terminate the Employee's employment without notice, or payment in lieu of notice, if the Employee engages in serious misconduct.</p>
                <p>Serious misconduct is when an employee:</p>
                <ul>
                    <li>causes serious and imminent risk to the health and safety of another person or to the reputation, viability or profits of their employer's business, or</li>
                    <li>wilfully or deliberately behaves in a way that's inconsistent with continuing their employment.</li>
                </ul>
                <p>Examples of serious misconduct include:</p>
                <ul>
                    <li>theft</li>
                    <li>fraud</li>
                    <li>violence/assault</li>
                    <li>sexual harassment</li>
                    <li>serious breaches of health and safety requirements</li>
                    <li>being drunk or affected by drugs at work</li>
                    <li>refusing to carry out work duties.</li>
                </ul>
            ` : ''}
        </div>
    `;
    
    return html;
}

async function generateContractWordDocument(html) {
    try {
        // Use the html-docx-js library that's already loaded
        const converted = htmlDocx.asBlob(html);
        const filename = `Employment_Contract_${contractBuilderState.data.step1.positionTitle.replace(/\s+/g, '_')}_${Date.now()}.docx`;
        
        saveAs(converted, filename);
        
    } catch (error) {
        throw error;
    }
}

async function generateContractPDFDocument(html) {
    try {
        // Use pdfmake which is already loaded
        const docDefinition = {
            content: [
                { text: 'Employment Contract', style: 'header' },
                { text: html, style: 'body' }
            ],
            styles: {
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 20] },
                body: { fontSize: 11, lineHeight: 1.4 }
            }
        };
        
        const filename = `Employment_Contract_${contractBuilderState.data.step1.positionTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
        
    } catch (error) {
        throw error;
    }
}

function showContractLoading(message) {
    const loadingHTML = `
        <div class="loading-overlay" id="contractLoadingOverlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    const builder = document.getElementById('employmentContractBuilder');
    const existing = document.getElementById('contractLoadingOverlay');
    if (existing) existing.remove();
    
    builder.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideContractLoading() {
    const overlay = document.getElementById('contractLoadingOverlay');
    if (overlay) overlay.remove();
}

