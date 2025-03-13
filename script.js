// Initialize transactions from localStorage or empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budget = JSON.parse(localStorage.getItem('budget')) || {
    monthlyIncomeTarget: 0,
    monthlyExpenseLimit: 0
};
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let savings = JSON.parse(localStorage.getItem('savings')) || 0;

// Initialize investments from localStorage
let investments = JSON.parse(localStorage.getItem('investments')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
        budgetAlerts: true,
        billReminders: true,
        investmentUpdates: true
    }
};

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpenses = document.getElementById('totalExpenses');
const searchInput = document.getElementById('searchInput');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const filterButton = document.getElementById('filterButton');
const resetButton = document.getElementById('resetButton');
const exportButton = document.getElementById('exportButton');
const themeToggle = document.getElementById('themeToggle');
const monthlyIncomeTarget = document.getElementById('monthlyIncomeTarget');
const monthlyExpenseLimit = document.getElementById('monthlyExpenseLimit');
const incomeProgress = document.getElementById('incomeProgress');
const expenseProgress = document.getElementById('expenseProgress');
const transactionCount = document.getElementById('transactionCount');
const averageAmount = document.getElementById('averageAmount');
const goalForm = document.getElementById('goalForm');
const goalsList = document.getElementById('goalsList');
const navToggle = document.getElementById('navToggle');
const navbar = document.querySelector('.navbar');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-items a');

// Additional DOM Elements
const investmentForm = document.getElementById('investmentForm');
const investmentsList = document.getElementById('investmentsList');
const accountSettingsForm = document.getElementById('accountSettingsForm');
const backupDataBtn = document.getElementById('backupData');
const restoreDataBtn = document.getElementById('restoreData');
const clearDataBtn = document.getElementById('clearData');

// Navigation handling
function toggleNav() {
    navbar.classList.toggle('active');
}

function switchSection(sectionId) {
    // Update active section
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });

    // Close mobile nav if open
    if (window.innerWidth <= 768) {
        navbar.classList.remove('active');
    }
}

// Event listeners for navigation
navToggle.addEventListener('click', toggleNav);
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        switchSection(sectionId);
    });
});

// Handle section switching on hash change
window.addEventListener('hashchange', () => {
    const sectionId = window.location.hash.substring(1) || 'dashboard';
    switchSection(sectionId);
});

// Initialize section based on URL hash
const initialSection = window.location.hash.substring(1) || 'dashboard';
switchSection(initialSection);

// Theme handling
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Initialize budget
monthlyIncomeTarget.value = budget.monthlyIncomeTarget;
monthlyExpenseLimit.value = budget.monthlyExpenseLimit;

// Budget handling
function updateBudget() {
    budget.monthlyIncomeTarget = parseFloat(monthlyIncomeTarget.value) || 0;
    budget.monthlyExpenseLimit = parseFloat(monthlyExpenseLimit.value) || 0;
    localStorage.setItem('budget', JSON.stringify(budget));
    updateProgressBars();
}

monthlyIncomeTarget.addEventListener('change', updateBudget);
monthlyExpenseLimit.addEventListener('change', updateBudget);

// Update progress bars
function updateProgressBars() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return t.type === 'income' && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
        .filter(t => {
            const date = new Date(t.date);
            return t.type === 'expense' && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    incomeProgress.style.width = `${Math.min((monthlyIncome / budget.monthlyIncomeTarget) * 100, 100)}%`;
    expenseProgress.style.width = `${Math.min((monthlyExpenses / budget.monthlyExpenseLimit) * 100, 100)}%`;
}

// Chart initialization
const ctx = document.getElementById('expenseChart').getContext('2d');
let expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#000000',
                '#333333',
                '#666666',
                '#999999',
                '#CCCCCC'
            ]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            }
        }
    }
});

const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
let monthlyChart = new Chart(monthlyCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Income',
            data: [],
            backgroundColor: '#000000'
        }, {
            label: 'Expenses',
            data: [],
            backgroundColor: '#666666'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Update summary with trends
function updateSummary() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const summary = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const lastMonth = transactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        if (date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear) {
            if (transaction.type === 'income') {
                acc.income += transaction.amount;
            } else {
                acc.expenses += transaction.amount;
            }
        }
        return acc;
    }, { income: 0, expenses: 0 });

    totalIncome.textContent = summary.income.toFixed(2);
    totalExpenses.textContent = summary.expenses.toFixed(2);
    totalBalance.textContent = (summary.income - summary.expenses).toFixed(2);

    // Update trend indicators
    updateTrendIndicator('incomeTrend', summary.income, lastMonth.income);
    updateTrendIndicator('expenseTrend', summary.expenses, lastMonth.expenses);
    updateTrendIndicator('balanceTrend', 
        summary.income - summary.expenses, 
        lastMonth.income - lastMonth.expenses
    );
}

function updateTrendIndicator(elementId, current, previous) {
    const element = document.getElementById(elementId);
    const difference = current - previous;
    const percentage = previous ? ((difference / previous) * 100).toFixed(1) : 0;
    
    if (difference > 0) {
        element.innerHTML = `<i class="fas fa-arrow-up"></i> ${percentage}%`;
        element.className = 'trend-indicator trend-up';
    } else if (difference < 0) {
        element.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(percentage)}%`;
        element.className = 'trend-indicator trend-down';
    } else {
        element.innerHTML = '<i class="fas fa-minus"></i> 0%';
        element.className = 'trend-indicator';
    }
}

// Update charts
function updateCharts() {
    // Expense distribution chart
    const categoryTotals = {};
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        }
    });

    expenseChart.data.labels = Object.keys(categoryTotals);
    expenseChart.data.datasets[0].data = Object.values(categoryTotals);
    expenseChart.update();

    // Monthly overview chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((_, index) => {
        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === index && date.getFullYear() === currentYear;
        });
        
        return {
            income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        };
    });

    monthlyChart.data.labels = months;
    monthlyChart.data.datasets[0].data = monthlyData.map(d => d.income);
    monthlyChart.data.datasets[1].data = monthlyData.map(d => d.expenses);
    monthlyChart.update();
}

// Filter transactions
function filterTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    const start = startDate.value ? new Date(startDate.value) : null;
    const end = endDate.value ? new Date(endDate.value) : null;
    const selectedCategory = document.getElementById('filterCategory').value;
    const selectedType = document.getElementById('filterType').value;

    return transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                            transaction.category.toLowerCase().includes(searchTerm);
        const transactionDate = new Date(transaction.date);
        const matchesDate = (!start || transactionDate >= start) && 
                          (!end || transactionDate <= end);
        const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
        const matchesType = !selectedType || transaction.type === selectedType;
        
        return matchesSearch && matchesDate && matchesCategory && matchesType;
    });
}

// Quick filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const period = btn.dataset.period;
        const today = new Date();
        let start = new Date();
        
        switch(period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(today.getFullYear() - 1);
                break;
        }
        
        startDate.value = start.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
        displayTransactions();
    });
});

// Goals handling
function addGoal(e) {
    e.preventDefault();
    
    const name = document.getElementById('goalName').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);
    const date = document.getElementById('goalDate').value;
    
    const goal = {
        id: Date.now(),
        name,
        amount,
        date,
        progress: 0,
        completed: false
    };
    
    goals.push(goal);
    localStorage.setItem('goals', JSON.stringify(goals));
    
    displayGoals();
    
    // Reset form
    goalForm.reset();
}

function updateGoalProgress(goalId, amount) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.progress = Math.min(goal.progress + amount, goal.amount);
        if (goal.progress >= goal.amount) {
            goal.completed = true;
        }
        localStorage.setItem('goals', JSON.stringify(goals));
        displayGoals();
    }
}

function deleteGoal(id) {
    goals = goals.filter(goal => goal.id !== id);
    localStorage.setItem('goals', JSON.stringify(goals));
    displayGoals();
}

function displayGoals() {
    goalsList.innerHTML = '';
    
    goals.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(goal => {
        const progress = (goal.progress / goal.amount) * 100;
        const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));
        
        const item = document.createElement('div');
        item.classList.add('goal-item');
        if (goal.completed) item.classList.add('completed');
        
        item.innerHTML = `
            <div class="goal-info">
                <div class="goal-name">${goal.name}</div>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="goal-details">
                    ₹${goal.progress.toFixed(2)} / ₹${goal.amount.toFixed(2)}
                    <br>
                    ${daysLeft > 0 ? `${daysLeft} days left` : 'Completed'}
                </div>
            </div>
            <div class="goal-actions">
                <button onclick="updateGoalProgress(${goal.id}, ${goal.amount * 0.1})">+10%</button>
                <button onclick="deleteGoal(${goal.id})">Delete</button>
            </div>
        `;
        
        goalsList.appendChild(item);
    });
}

// Enhanced transaction handling
function addTransaction(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;
    
    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        notes,
        date: new Date().toLocaleDateString(),
        recurring: document.getElementById('recurring').checked,
        recurringFrequency: document.getElementById('recurringFrequency').value
    };
    
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update savings if it's an income transaction
    if (type === 'income') {
        savings += amount;
        localStorage.setItem('savings', savings);
    }
    
    displayTransactions();
    updateSummary();
    updateCharts();
    updateProgressBars();
    displayGoals();
    
    // Reset form
    transactionForm.reset();
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    displayTransactions();
    updateSummary();
    updateCharts();
    updateProgressBars();
}

// Display transactions
function displayTransactions() {
    transactionsList.innerHTML = '';
    
    const filteredTransactions = filterTransactions();
    
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(transaction => {
        const sign = transaction.type === 'income' ? '+' : '-';
        const item = document.createElement('div');
        item.classList.add('transaction-item');
        
        item.innerHTML = `
            <div>
                <div>
                    ${transaction.description}
                    <span class="category-tag">${transaction.category}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--secondary-color);">
                    ${transaction.date}
                    ${transaction.notes ? `<br>${transaction.notes}` : ''}
                </div>
            </div>
            <div>
                <span class="${transaction.type}">${sign}₹${transaction.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">×</button>
            </div>
        `;
        
        transactionsList.appendChild(item);
    });

    // Update transaction stats
    transactionCount.textContent = filteredTransactions.length;
    const average = filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / 
                   (filteredTransactions.length || 1);
    averageAmount.textContent = average.toFixed(2);
}

// Export to CSV
function exportToCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            t.date,
            `"${t.description}"`,
            t.category,
            t.type,
            t.amount,
            `"${t.notes || ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Financial Report', 20, 20);
    
    // Add summary
    doc.setFontSize(12);
    doc.text(`Total Balance: ₹${totalBalance.textContent}`, 20, 40);
    doc.text(`Total Income: ₹${totalIncome.textContent}`, 20, 50);
    doc.text(`Total Expenses: ₹${totalExpenses.textContent}`, 20, 60);
    
    // Add transactions
    doc.setFontSize(14);
    doc.text('Recent Transactions', 20, 80);
    doc.setFontSize(10);
    
    let y = 90;
    filterTransactions().slice(0, 20).forEach(transaction => {
        const text = `${transaction.date} - ${transaction.description} - ₹${transaction.amount}`;
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(text, 20, y);
        y += 10;
    });
    
    doc.save('financial-report.pdf');
}

// Event listeners
transactionForm.addEventListener('submit', addTransaction);
searchInput.addEventListener('input', displayTransactions);
filterButton.addEventListener('click', displayTransactions);
resetButton.addEventListener('click', () => {
    searchInput.value = '';
    startDate.value = '';
    endDate.value = '';
    displayTransactions();
});
exportButton.addEventListener('click', exportToCSV);
goalForm.addEventListener('submit', addGoal);
document.getElementById('exportPDFButton').addEventListener('click', exportToPDF);

// Update category options based on transaction type
document.getElementById('type').addEventListener('change', function() {
    const categorySelect = document.getElementById('category');
    const selectedType = this.value;
    
    // Clear current options
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    // Add appropriate options based on type
    if (selectedType === 'income') {
        categorySelect.innerHTML += `
            <optgroup label="Income Categories">
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="investments">Investments</option>
                <option value="other_income">Other Income</option>
            </optgroup>
        `;
    } else {
        categorySelect.innerHTML += `
            <optgroup label="Expense Categories">
                <option value="food">Food & Dining</option>
                <option value="transport">Transportation</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="other_expense">Other Expenses</option>
            </optgroup>
        `;
    }
});

// Initial display
displayTransactions();
updateSummary();
updateCharts();
updateProgressBars();
displayGoals();

// Financial Health Score Calculation
function calculateHealthScore() {
    const score = {
        savingsRate: calculateSavingsRate(),
        expenseControl: calculateExpenseControl(),
        incomeGrowth: calculateIncomeGrowth()
    };

    const totalScore = Math.round(
        (score.savingsRate * 0.4 + 
         score.expenseControl * 0.3 + 
         score.incomeGrowth * 0.3)
    );

    document.getElementById('healthScore').textContent = totalScore;
    document.getElementById('savingsRateProgress').style.width = `${score.savingsRate}%`;
    document.getElementById('expenseControlProgress').style.width = `${score.expenseControl}%`;
    document.getElementById('incomeGrowthProgress').style.width = `${score.incomeGrowth}%`;

    return totalScore;
}

function calculateSavingsRate() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const savings = totalIncome - totalExpenses;
    return Math.min((savings / totalIncome) * 100, 100);
}

function calculateExpenseControl() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions
        .filter(t => {
            const date = new Date(t.date);
            return t.type === 'expense' && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    return Math.max(100 - (monthlyExpenses / budget.monthlyExpenseLimit) * 100, 0);
}

function calculateIncomeGrowth() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return t.type === 'income' && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return t.type === 'income' && 
                   date.getMonth() === currentMonth - 1 && 
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    return Math.min(((currentIncome - lastMonthIncome) / lastMonthIncome) * 100, 100);
}

// Predictive Insights
function generateInsights() {
    const healthScore = calculateHealthScore();
    const monthlyExpenses = calculateMonthlyExpenses();
    const monthlyIncome = calculateMonthlyIncome();
    
    // Monthly Projection
    const projection = monthlyIncome - monthlyExpenses;
    document.getElementById('monthlyProjection').textContent = 
        `Expected balance: ₹${projection.toFixed(2)}`;
    
    // Potential Issues
    const issues = [];
    if (monthlyExpenses > budget.monthlyExpenseLimit) {
        issues.push('Exceeding monthly expense limit');
    }
    if (healthScore < 50) {
        issues.push('Low financial health score');
    }
    document.getElementById('potentialIssues').textContent = 
        issues.length ? issues.join(', ') : 'No issues detected';
    
    // Smart Suggestions
    const suggestions = [];
    if (monthlyExpenses > monthlyIncome * 0.8) {
        suggestions.push('Consider reducing discretionary spending');
    }
    if (healthScore < 70) {
        suggestions.push('Focus on increasing savings rate');
    }
    document.getElementById('smartSuggestions').textContent = 
        suggestions.length ? suggestions.join(', ') : 'Your finances are well-managed';
}

// Investment Portfolio Management
function addInvestment(e) {
    e.preventDefault();
    
    const investment = {
        id: Date.now(),
        name: document.getElementById('investmentName').value,
        amount: parseFloat(document.getElementById('investmentAmount').value),
        type: document.getElementById('investmentType').value,
        date: document.getElementById('investmentDate').value,
        expectedReturn: parseFloat(document.getElementById('expectedReturn').value),
        currentValue: parseFloat(document.getElementById('investmentAmount').value)
    };
    
    investments.push(investment);
    localStorage.setItem('investments', JSON.stringify(investments));
    
    displayInvestments();
    updatePortfolioSummary();
    
    investmentForm.reset();
}

function displayInvestments() {
    investmentsList.innerHTML = '';
    
    investments.forEach(investment => {
        const returns = calculateInvestmentReturns(investment);
        const item = document.createElement('div');
        item.classList.add('investment-item');
        
        item.innerHTML = `
            <div class="investment-info">
                <div>${investment.name}</div>
                <div>${investment.type}</div>
                <div>Initial: ₹${investment.amount.toFixed(2)}</div>
            </div>
            <div class="investment-returns">
                <span class="${returns >= 0 ? 'return-positive' : 'return-negative'}">
                    ${returns >= 0 ? '+' : ''}${returns.toFixed(2)}%
                </span>
                <button class="delete-btn" onclick="deleteInvestment(${investment.id})">×</button>
            </div>
        `;
        
        investmentsList.appendChild(item);
    });
}

function calculateInvestmentReturns(investment) {
    const months = (new Date() - new Date(investment.date)) / (1000 * 60 * 60 * 24 * 30);
    return ((investment.currentValue - investment.amount) / investment.amount) * 100;
}

function updatePortfolioSummary() {
    const totalValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalReturns = investments.reduce((sum, i) => sum + calculateInvestmentReturns(i), 0);
    
    document.getElementById('portfolioValue').textContent = `₹${totalValue.toFixed(2)}`;
    document.getElementById('portfolioReturns').textContent = 
        `${totalReturns >= 0 ? '+' : ''}${totalReturns.toFixed(2)}%`;
    
    // Update portfolio chart
    updatePortfolioChart();
}

function deleteInvestment(id) {
    investments = investments.filter(i => i.id !== id);
    localStorage.setItem('investments', JSON.stringify(investments));
    displayInvestments();
    updatePortfolioSummary();
}

// Settings Management
function saveSettings(e) {
    e.preventDefault();
    
    settings = {
        currency: document.getElementById('currency').value,
        dateFormat: document.getElementById('dateFormat').value,
        notifications: {
            budgetAlerts: document.getElementById('budgetAlerts').checked,
            billReminders: document.getElementById('billReminders').checked,
            investmentUpdates: document.getElementById('investmentUpdates').checked
        }
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    applySettings();
    showNotification('Settings saved successfully');
}

function applySettings() {
    // Apply currency format
    const currencySymbol = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€'
    }[settings.currency];
    
    // Update all currency displays
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = currencySymbol;
    });
    
    // Apply date format
    const dateFormat = settings.dateFormat;
    // Update date displays
    document.querySelectorAll('.date-display').forEach(el => {
        const date = new Date(el.dataset.date);
        el.textContent = formatDate(date, dateFormat);
    });
}

function formatDate(date, format) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return format
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year);
}

// Data Management
function backupData() {
    const data = {
        transactions,
        budget,
        goals,
        investments,
        settings
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                transactions = data.transactions;
                budget = data.budget;
                goals = data.goals;
                investments = data.investments;
                settings = data.settings;
                
                localStorage.setItem('transactions', JSON.stringify(transactions));
                localStorage.setItem('budget', JSON.stringify(budget));
                localStorage.setItem('goals', JSON.stringify(goals));
                localStorage.setItem('investments', JSON.stringify(investments));
                localStorage.setItem('settings', JSON.stringify(settings));
                
                applySettings();
                displayTransactions();
                displayGoals();
                displayInvestments();
                updateSummary();
                updateCharts();
                showNotification('Data restored successfully');
            } catch (error) {
                showNotification('Error restoring data', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.clear();
        transactions = [];
        budget = { monthlyIncomeTarget: 0, monthlyExpenseLimit: 0 };
        goals = [];
        investments = [];
        settings = {
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            notifications: {
                budgetAlerts: true,
                billReminders: true,
                investmentUpdates: true
            }
        };
        
        displayTransactions();
        displayGoals();
        displayInvestments();
        updateSummary();
        updateCharts();
        showNotification('All data cleared');
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Event Listeners
investmentForm.addEventListener('submit', addInvestment);
accountSettingsForm.addEventListener('submit', saveSettings);
backupDataBtn.addEventListener('click', backupData);
restoreDataBtn.addEventListener('click', restoreData);
clearDataBtn.addEventListener('click', clearData);

// Initialize new features
calculateHealthScore();
generateInsights();
displayInvestments();
updatePortfolioSummary();
applySettings(); 