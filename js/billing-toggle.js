// Billing toggle state - DEFAULT TO ANNUAL
let currentBilling = 'annual';

function setBilling(billing) {
    currentBilling = billing;
    
    const monthlyBtn = document.getElementById('billingMonthly');
    const annualBtn = document.getElementById('billingAnnual');
    
    if (billing === 'monthly') {
        monthlyBtn.classList.add('bg-amber-500', 'text-slate-900');
        monthlyBtn.classList.remove('text-slate-400');
        annualBtn.classList.remove('bg-amber-500', 'text-slate-900');
        annualBtn.classList.add('text-slate-400');
        
        document.getElementById('starterPrice').textContent = '$29';
        document.getElementById('starterBilling').textContent = '/month';
        document.getElementById('starterMonthlyEquiv').textContent = '$348/year billed monthly';
        document.getElementById('starterMonthlyEquiv').classList.remove('text-green-400');
        document.getElementById('starterMonthlyEquiv').classList.add('text-slate-500');
        
        document.getElementById('proPrice').textContent = '$49';
        document.getElementById('proBilling').textContent = '/month';
        document.getElementById('proMonthlyEquiv').textContent = '$588/year billed monthly';
        document.getElementById('proMonthlyEquiv').classList.remove('text-green-400');
        document.getElementById('proMonthlyEquiv').classList.add('text-slate-500');
        
        document.getElementById('businessPrice').textContent = '$99';
        document.getElementById('businessBilling').textContent = '/month';
        document.getElementById('businessMonthlyEquiv').textContent = '$1,188/year billed monthly';
        document.getElementById('businessMonthlyEquiv').classList.remove('text-green-400');
        document.getElementById('businessMonthlyEquiv').classList.add('text-slate-500');
        
        document.getElementById('starterReviews').textContent = '8';
        document.getElementById('starterReviewsPeriod').textContent = 'credits/month';
        document.getElementById('proReviews').textContent = '20';
        document.getElementById('proReviewsPeriod').textContent = 'credits/month';
        document.getElementById('businessReviews').textContent = '50';
        document.getElementById('businessReviewsPeriod').textContent = 'credits/month';
    } else {
        annualBtn.classList.add('bg-amber-500', 'text-slate-900');
        annualBtn.classList.remove('text-slate-400');
        monthlyBtn.classList.remove('bg-amber-500', 'text-slate-900');
        monthlyBtn.classList.add('text-slate-400');
        
        document.getElementById('starterPrice').textContent = '$249';
        document.getElementById('starterBilling').textContent = '/year';
        document.getElementById('starterMonthlyEquiv').textContent = 'Just $21/month';
        document.getElementById('starterMonthlyEquiv').classList.add('text-green-400');
        document.getElementById('starterMonthlyEquiv').classList.remove('text-slate-500');
        
        document.getElementById('proPrice').textContent = '$449';
        document.getElementById('proBilling').textContent = '/year';
        document.getElementById('proMonthlyEquiv').textContent = 'Just $37/month';
        document.getElementById('proMonthlyEquiv').classList.add('text-green-400');
        document.getElementById('proMonthlyEquiv').classList.remove('text-slate-500');
        
        document.getElementById('businessPrice').textContent = '$899';
        document.getElementById('businessBilling').textContent = '/year';
        document.getElementById('businessMonthlyEquiv').textContent = 'Just $75/month';
        document.getElementById('businessMonthlyEquiv').classList.add('text-green-400');
        document.getElementById('businessMonthlyEquiv').classList.remove('text-slate-500');
        
        document.getElementById('starterReviews').textContent = '96';
        document.getElementById('starterReviewsPeriod').textContent = 'credits/year';
        document.getElementById('proReviews').textContent = '240';
        document.getElementById('proReviewsPeriod').textContent = 'credits/year';
        document.getElementById('businessReviews').textContent = '600';
        document.getElementById('businessReviewsPeriod').textContent = 'credits/year';
    }
}
