import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rankings Test</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="container mx-auto py-6 space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
                <h1 class="text-3xl font-bold mb-4">Rankings Test Page</h1>
                <p class="text-gray-600 mb-6">Testing ranking components manually</p>
                
                <!-- Quick Stats -->
                <div class="grid gap-4 md:grid-cols-4 mb-6">
                    <div class="bg-white border rounded-lg p-4">
                        <h3 class="text-sm font-medium text-gray-600">Total Users</h3>
                        <div class="text-2xl font-bold">245</div>
                        <p class="text-xs text-gray-500">220 students, 25 teachers</p>
                    </div>
                    <div class="bg-white border rounded-lg p-4">
                        <h3 class="text-sm font-medium text-gray-600">Points Awarded</h3>
                        <div class="text-2xl font-bold">15,420</div>
                        <p class="text-xs text-gray-500">+12% from last month</p>
                    </div>
                    <div class="bg-white border rounded-lg p-4">
                        <h3 class="text-sm font-medium text-gray-600">Active Achievements</h3>
                        <div class="text-2xl font-bold">24</div>
                        <p class="text-xs text-gray-500">8 pending rewards</p>
                    </div>
                    <div class="bg-white border rounded-lg p-4">
                        <h3 class="text-sm font-medium text-gray-600">Engagement</h3>
                        <div class="text-2xl font-bold">87.5%</div>
                        <p class="text-xs text-gray-500">Across all users</p>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div class="border-b border-gray-200 mb-4">
                    <nav class="flex space-x-8">
                        <button onclick="showTab('overview')" class="tab-btn py-2 px-1 border-b-2 border-blue-500 text-blue-600">
                            🏆 Overview
                        </button>
                        <button onclick="showTab('leaderboards')" class="tab-btn py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            🎯 Leaderboards
                        </button>
                        <button onclick="showTab('points')" class="tab-btn py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            🏅 Points
                        </button>
                        <button onclick="showTab('achievements')" class="tab-btn py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            🏅 Achievements
                        </button>
                        <button onclick="showTab('rewards')" class="tab-btn py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            🎁 Rewards
                        </button>
                        <button onclick="showTab('analytics')" class="tab-btn py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            📊 Analytics
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div id="overview" class="tab-content">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="bg-white border rounded-lg p-6">
                            <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div class="space-y-2">
                                <button onclick="testButton('Award Points')" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                                    ➕ Award Points
                                </button>
                                <button onclick="testButton('Give Achievement')" class="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded hover:bg-gray-200">
                                    🏅 Give Achievement
                                </button>
                                <button onclick="testButton('Approve Reward')" class="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded hover:bg-gray-200">
                                    🎁 Approve Reward
                                </button>
                            </div>
                        </div>
                        <div class="bg-white border rounded-lg p-6">
                            <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Ali Karimov earned 15 points</span>
                                    <span class="text-gray-500">2m ago</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Nargiza unlocked achievement</span>
                                    <span class="text-gray-500">5m ago</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Dilshod redeemed reward</span>
                                    <span class="text-gray-500">8m ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="leaderboards" class="tab-content hidden">
                    <div class="bg-white border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Top Performers</h3>
                        <div class="space-y-2">
                            ${Array.from({length: 5}, (_, i) => `
                                <div class="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                    <div class="flex items-center gap-3">
                                        <span class="font-bold">#${i+1}</span>
                                        <div>
                                            <p class="font-medium">User Name ${i+1}</p>
                                            <p class="text-sm text-gray-500">Level ${10-i}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-bold">${1000-i*50} pts</p>
                                        <p class="text-sm text-gray-500">+${20-i} today</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div id="points" class="tab-content hidden">
                    <div class="bg-white border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Points Management</h3>
                        <button onclick="testButton('Award Points')" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                            ➕ Award Points
                        </button>
                    </div>
                </div>

                <div id="achievements" class="tab-content hidden">
                    <div class="bg-white border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Achievement Management</h3>
                        <button onclick="testButton('Create Achievement')" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                            ➕ Create Achievement
                        </button>
                    </div>
                </div>

                <div id="rewards" class="tab-content hidden">
                    <div class="bg-white border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Rewards Catalog</h3>
                        <button onclick="testButton('Add Reward')" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                            ➕ Add Reward
                        </button>
                    </div>
                </div>

                <div id="analytics" class="tab-content hidden">
                    <div class="bg-white border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Analytics Dashboard</h3>
                        <p class="text-gray-500">Analytics data will be displayed here</p>
                    </div>
                </div>

                <!-- Results Area -->
                <div id="results" class="mt-6 p-4 bg-gray-100 rounded-lg">
                    <h3 class="font-semibold mb-2">Button Test Results:</h3>
                    <div id="result-list" class="text-sm space-y-1">
                        <p class="text-gray-600">Click buttons above to test functionality...</p>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let testResults = [];
            
            function showTab(tabName) {
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.add('hidden');
                });
                
                // Remove active style from all tab buttons
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('border-blue-500', 'text-blue-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                
                // Show selected tab
                document.getElementById(tabName).classList.remove('hidden');
                
                // Add active style to clicked button
                event.target.classList.add('border-blue-500', 'text-blue-600');
                event.target.classList.remove('border-transparent', 'text-gray-500');
                
                // Log tab navigation
                logResult('Tab Navigation', 'Switched to ' + tabName + ' tab', '✅ Working');
            }
            
            function testButton(buttonName) {
                // Simulate button functionality
                const timestamp = new Date().toLocaleTimeString();
                let status = '✅ Working';
                let message = buttonName + ' button clicked successfully';
                
                // Add some mock functionality
                switch(buttonName) {
                    case 'Award Points':
                        message += ' - Mock: Would open points award dialog';
                        break;
                    case 'Give Achievement':
                        message += ' - Mock: Would open achievement selection dialog';
                        break;
                    case 'Approve Reward':
                        message += ' - Mock: Would show pending rewards for approval';
                        break;
                    case 'Create Achievement':
                        message += ' - Mock: Would open new achievement form';
                        break;
                    case 'Add Reward':
                        message += ' - Mock: Would open new reward form';
                        break;
                    default:
                        message += ' - Mock functionality executed';
                }
                
                logResult(buttonName, message, status);
            }
            
            function logResult(category, message, status) {
                const timestamp = new Date().toLocaleTimeString();
                testResults.push({
                    category,
                    message,
                    status,
                    timestamp
                });
                
                updateResultsList();
            }
            
            function updateResultsList() {
                const resultsList = document.getElementById('result-list');
                resultsList.innerHTML = testResults.map(result => 
                    '<div class="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">' +
                        '<span><strong>' + result.category + ':</strong> ' + result.message + '</span>' +
                        '<span class="text-xs text-gray-500">' + result.status + ' ' + result.timestamp + '</span>' +
                    '</div>'
                ).join('');
            }
            
            // Initialize with overview tab active
            window.onload = function() {
                logResult('Page Load', 'Rankings test page loaded successfully', '✅ Working');
            };
        </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}