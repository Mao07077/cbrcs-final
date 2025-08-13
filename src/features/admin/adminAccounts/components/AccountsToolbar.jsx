import { FiPlus, FiDownload, FiPrinter, FiEye, FiFileText } from "react-icons/fi";
import { PDFDownloadLink } from "@react-pdf/renderer";
import useAccountStore from "../../../../store/admin/accountStore";
import AccountsReportPDF from "./AccountsReportPDF";

const AccountsToolbar = ({ onFilterChange, selectedAccounts, filters }) => {
  const { openModal } = useAccountStore();

  const handlePrintPreview = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one account to preview.');
      return;
    }

    const previewWindow = window.open('', '_blank');
    const previewContent = generateHTMLPreview(selectedAccounts, filters);
    
    previewWindow.document.write(previewContent);
    previewWindow.document.close();
    previewWindow.focus();
  };

  const handleDirectPrint = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one account to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const printContent = generateHTMLPreview(selectedAccounts, filters, true);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateHTMLPreview = (accounts, filters, isPrint = false) => {
    const roleFilter = filters?.role || 'All Roles';
    const searchQuery = filters?.query || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CBRCS Accounts Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            color: #333; 
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #4F46E5; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .title { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1F2937; 
            margin-bottom: 8px; 
          }
          .subtitle { 
            font-size: 16px; 
            color: #6B7280; 
            margin-bottom: 5px;
          }
          .filters-info {
            background-color: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #4F46E5;
          }
          .filters-info h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 18px;
          }
          .filter-item {
            margin: 5px 0;
            font-size: 14px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          .stat-card {
            background-color: #F9FAFB;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            text-align: center;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
          }
          .stat-label {
            color: #6B7280;
            font-size: 14px;
            margin-top: 5px;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .table th, .table td { 
            border: 1px solid #E5E7EB; 
            padding: 12px 15px; 
            text-align: left; 
          }
          .table th { 
            background-color: #4F46E5; 
            color: white;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table tr:nth-child(even) { 
            background-color: #F9FAFB; 
          }
          .table tr:hover {
            background-color: #F3F4F6;
          }
          .role-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }
          .role-admin { background-color: #FEE2E2; color: #DC2626; }
          .role-instructor { background-color: #DBEAFE; color: #2563EB; }
          .role-student { background-color: #D1FAE5; color: #059669; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            font-size: 12px;
            color: #9CA3AF;
          }
          .no-print { display: ${isPrint ? 'none' : 'block'}; }
          @media print { 
            body { margin: 0; font-size: 12px; }
            .header { page-break-after: avoid; }
            .table { page-break-inside: avoid; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CBRCS Accounts Report</div>
          <div class="subtitle">Computer-Based Reading Comprehension System</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="filters-info">
          <h3>Report Filters & Settings</h3>
          <div class="filter-item"><strong>Role Filter:</strong> ${roleFilter}</div>
          <div class="filter-item"><strong>Search Query:</strong> ${searchQuery || 'None'}</div>
          <div class="filter-item"><strong>Total Selected Accounts:</strong> ${accounts.length}</div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${accounts.length}</div>
            <div class="stat-label">Total Accounts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${accounts.filter(acc => acc.role === 'student').length}</div>
            <div class="stat-label">Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${accounts.filter(acc => acc.role === 'instructor').length}</div>
            <div class="stat-label">Instructors</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${accounts.filter(acc => acc.role === 'admin').length}</div>
            <div class="stat-label">Admins</div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>ID Number</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${accounts.map(account => `
              <tr>
                <td><strong>${account.name || `${account.firstname || ''} ${account.lastname || ''}`.trim()}</strong></td>
                <td>${account.id_number || 'N/A'}</td>
                <td>${account.email || 'N/A'}</td>
                <td><span class="role-badge role-${account.role}">${account.role}</span></td>
                <td>${account.isActive !== false ? 'Active' : 'Inactive'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>CBRCS Admin Report</strong> - Confidential Information</p>
          <p>This report contains sensitive account information. Handle with care.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Left side: Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          onChange={(e) => onFilterChange({ query: e.target.value })}
          className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <select
          onChange={(e) => onFilterChange({ role: e.target.value })}
          className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Right side: Actions */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
        {selectedAccounts && selectedAccounts.length > 0 && (
          <>
            <button
              onClick={handlePrintPreview}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-all duration-200"
              title="Preview report before printing"
            >
              <FiEye className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preview ({selectedAccounts.length})</span>
              <span className="sm:hidden">Preview</span>
            </button>

            <button
              onClick={handleDirectPrint}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-200"
              title="Print report directly"
            >
              <FiPrinter className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <PDFDownloadLink
              document={<AccountsReportPDF accounts={selectedAccounts} filters={filters} />}
              fileName={`cbrcs_accounts_${filters?.role || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-200"
            >
              {({ loading }) =>
                loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </span>
                ) : (
                  <>
                    <FiDownload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">PDF ({selectedAccounts.length})</span>
                    <span className="sm:hidden">PDF</span>
                  </>
                )
              }
            </PDFDownloadLink>
          </>
        )}

        <button
          onClick={() => openModal(null)}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-200"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          <span>New Account</span>
        </button>
      </div>
    </div>
  );
};

export default AccountsToolbar;
