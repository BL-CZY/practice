let charts = {};

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= headers.length) {
      const transaction = {};
      headers.forEach((header, index) => {
        transaction[header] = values[index]?.trim();
      });
      
      // Convert amount to number
      if (transaction.amount) {
        transaction.amount = parseFloat(transaction.amount);
      }
      
      // Parse date
      if (transaction.date) {
        transaction.date = new Date(transaction.date);
      }
      
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

// Extract merchant category from description
function extractCategory(description) {
  const desc = description.toUpperCase();
  
  if (desc.includes('MCDONALD') || desc.includes('DOMINO') || desc.includes('DPZ') || 
      desc.includes('PIZZA') || desc.includes('STARBUCKS') || desc.includes('DELI')) {
    return 'Food & Dining';
  } else if (desc.includes('NETFLIX') || desc.includes('SPOTIFY') || desc.includes('CINEMA') || 
             desc.includes('CONCERT') || desc.includes('GAME')) {
    return 'Entertainment';
  } else if (desc.includes('ZARA') || desc.includes('BOOKSTORE') || desc.includes('AMAZON') || 
             desc.includes('AMZN') || desc.includes('LIDL') || desc.includes('TECH STORE')) {
    return 'Shopping';
  } else if (desc.includes('PARKING') || desc.includes('GOOGLE')) {
    return 'Transport & Services';
  } else if (desc.includes('PAYROLL') || desc.includes('REFUND')) {
    return 'Income';
  } else if (desc.includes('RENT')) {
    return 'Housing';
  } else if (desc.includes('MALTA POST')) {
    return 'Utilities';
  } else if (desc.includes('REVOLUT') || desc.includes('P2P')) {
    return 'Transfers';
  } else if (desc.includes('FX FEE')) {
    return 'Fees';
  }
  
  return 'Other';
}

// Generate charts
function generateCharts(transactions) {
  generateBalanceChart(transactions);
  generateCategoryChart(transactions);
  generateDailyChart(transactions);
  generateTypeChart(transactions);
}

// Balance flow chart
function generateBalanceChart(transactions) {
  const monthlyData = {};
  
  transactions.forEach(t => {
    if (!t.date || isNaN(t.amount)) return;
    
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.amount > 0) {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenses += Math.abs(t.amount);
    }
  });
  
  const labels = Object.keys(monthlyData).sort();
  const incomeData = labels.map(month => monthlyData[month].income);
  const expenseData = labels.map(month => monthlyData[month].expenses);
  
  const ctx = document.getElementById('balanceChart').getContext('2d');
  if (charts.balance) charts.balance.destroy();
  
  charts.balance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(l => {
        const [year, month] = l.split('-');
        return `${year}-${month}`;
      }),
      datasets: [{
        label: 'Income',
        data: incomeData,
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }, {
        label: 'Expenses',
        data: expenseData,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

// Category spending chart
function generateCategoryChart(transactions) {
  const categoryData = {};
  
  transactions.forEach(t => {
    if (!t.description || !t.amount || t.amount >= 0) return;
    
    const category = extractCategory(t.description);
    if (!categoryData[category]) {
      categoryData[category] = 0;
    }
    categoryData[category] += Math.abs(t.amount);
  });
  
  const sortedCategories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (charts.category) charts.category.destroy();
  
  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedCategories.map(([category]) => category),
      datasets: [{
        data: sortedCategories.map(([, amount]) => amount),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 10
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': €' + context.parsed.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Daily spending pattern
function generateDailyChart(transactions) {
  const dailyData = {};
  
  transactions.forEach(t => {
    if (!t.date || !t.amount || t.amount >= 0) return;
    
    const dateKey = t.date.toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = 0;
    }
    dailyData[dateKey] += Math.abs(t.amount);
  });
  
  const sortedDates = Object.keys(dailyData).sort();
  const last30Days = sortedDates.slice(-30);
  
  const ctx = document.getElementById('dailyChart').getContext('2d');
  if (charts.daily) charts.daily.destroy();
  
  charts.daily = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last30Days.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{
        label: 'Daily Spending',
        data: last30Days.map(date => dailyData[date]),
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

// Transaction types chart
function generateTypeChart(transactions) {
  const typeData = { credit: 0, debit: 0 };
  
  transactions.forEach(t => {
    if (!t.type || !t.amount) return;
    
    if (t.type === 'credit' || t.amount > 0) {
      typeData.credit += Math.abs(t.amount);
    } else {
      typeData.debit += Math.abs(t.amount);
    }
  });
  
  const ctx = document.getElementById('typeChart').getContext('2d');
  if (charts.type) charts.type.destroy();
  
  charts.type = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [typeData.credit, typeData.debit],
        backgroundColor: ['#4BC0C0', '#FF6384'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': €' + context.parsed.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Update statistics
function updateStats(transactions) {
  const validTransactions = transactions.filter(t => !isNaN(t.amount));
  const totalTransactions = validTransactions.length;
  
  const totalSpent = validTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalIncome = validTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const avgTransaction = totalTransactions > 0 ? 
    validTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / totalTransactions : 0;
  
  document.getElementById('totalTransactions').textContent = totalTransactions;
  document.getElementById('totalSpent').textContent = '€' + totalSpent.toFixed(2);
  document.getElementById('totalIncome').textContent = '€' + totalIncome.toFixed(2);
  document.getElementById('avgTransaction').textContent = '€' + avgTransaction.toFixed(2);
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

// Main analyze function
function analyzeData() {
  const csvInput = document.getElementById('csvInput');
  const csvText = csvInput.value.trim();

  puter.ai.chat(`Why did the chicken cross the road?`).then(puter.print);
  alert('Hello, world!');
  
  if (!csvText) {
    showError('Please paste your CSV data first.');
    return;
  }
  
  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  
  try {
    setTimeout(() => {
      const transactions = parseCSV(csvText);
      
      if (transactions.length === 0) {
        showError('No valid transactions found in the CSV data.');
        document.getElementById('loading').classList.add('hidden');
        return;
      }
      
      // Update statistics
      updateStats(transactions);
      
      // Generate charts
      generateCharts(transactions);
      
      // Show results
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('results').classList.remove('hidden');
    }, 500);
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    showError('Error parsing CSV data. Please check the format and try again.');
    document.getElementById('loading').classList.add('hidden');
  }
}

// Clear all data
function clearData() {
  document.getElementById('csvInput').value = '';
  document.getElementById('results').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  
  // Destroy existing charts
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('analyzeBtn').addEventListener('click', analyzeData);
  document.getElementById('clearBtn').addEventListener('click', clearData);
  
  // Allow Enter key to trigger analysis
  document.getElementById('csvInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      analyzeData();
    }
  });
});