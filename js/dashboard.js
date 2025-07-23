// Biểu đồ Profit & Expenses
const ctxProfit = document.getElementById('chartProfit')?.getContext('2d');
if (ctxProfit) {
  new Chart(ctxProfit, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Profit',
          data: [1200, 1900, 3000, 5000, 2300, 3100],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Expenses',
          data: [1000, 1500, 2800, 4200, 2000, 2600],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Biểu đồ Product Sales
const ctxSales = document.getElementById('chartSales')?.getContext('2d');
if (ctxSales) {
  new Chart(ctxSales, {
    type: 'bar',
    data: {
      labels: ['Shoes', 'Shirts', 'Hats', 'Pants', 'Jackets'],
      datasets: [
        {
          label: 'Sales',
          data: [500, 700, 300, 450, 600],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(201, 203, 207, 0.6)'
          ],
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
