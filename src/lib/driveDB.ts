import { fetchWithToken } from './googleApi';

const DB_FILE_NAME = 'Power_Service_CRM_Database';

export interface DriveDBInfo {
  spreadsheetId: string;
}

// Ensure the database file exists in Google Drive
export async function initializeDatabase(): Promise<DriveDBInfo> {
  // 1. Search for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DB_FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const searchResult = await fetchWithToken(searchUrl);

  if (searchResult.files && searchResult.files.length > 0) {
    const spreadsheetId = searchResult.files[0].id;
    
    // Check if all necessary sheets exist in the existing spreadsheet
    try {
      const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const spreadsheet = await fetchWithToken(getUrl);
      const existingSheetTitles = (spreadsheet.sheets || []).map((s: any) => s.properties.title);
      
      const requiredSheets = ['Customers', 'Tickets', 'Tasks', 'Leads', 'Opportunities'];
      const missingSheets = requiredSheets.filter(title => !existingSheetTitles.includes(title));
      
      if (missingSheets.length > 0) {
        const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        const requests = missingSheets.map(title => ({
          addSheet: { properties: { title } }
        }));
        
        await fetchWithToken(batchUpdateUrl, {
          method: 'POST',
          body: JSON.stringify({ requests })
        });
        
        // Setup headers for newly added sheets
        await setupHeadersForSheets(spreadsheetId, missingSheets);
      }
    } catch (e) {
      console.error('Error auto-verifying sheets in existing spreadsheet:', e);
    }
    
    return { spreadsheetId };
  }

  // 2. If not found, create a new spreadsheet
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createBody = {
    properties: {
      title: DB_FILE_NAME,
    },
    sheets: [
      { properties: { title: 'Customers' } },
      { properties: { title: 'Tickets' } },
      { properties: { title: 'Tasks' } },
      { properties: { title: 'Leads' } },
      { properties: { title: 'Opportunities' } }
    ]
  };

  const createResult = await fetchWithToken(createUrl, {
    method: 'POST',
    body: JSON.stringify(createBody)
  });

  // Add headers
  const spreadsheetId = createResult.spreadsheetId;
  await setupHeaders(spreadsheetId);

  return { spreadsheetId };
}

async function setupHeadersForSheets(spreadsheetId: string, sheetTitles: string[]) {
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const headerMap: Record<string, { range: string; values: any[][] }> = {
    Customers: {
      range: 'Customers!A1:H1',
      values: [['ID', 'Name', 'Phone', 'Email', 'Source', 'Status', 'Segment', 'CreatedAt']]
    },
    Tickets: {
      range: 'Tickets!A1:I1',
      values: [['ID', 'Title', 'CustomerName', 'Status', 'Priority', 'Category', 'Assignee', 'CreatedAt', 'UpdatedAt']]
    },
    Tasks: {
      range: 'Tasks!A1:F1',
      values: [['ID', 'Title', 'Type', 'Priority', 'Status', 'DueDate']]
    },
    Leads: {
      range: 'Leads!A1:G1',
      values: [['ID', 'Name', 'Company', 'Value', 'Priority', 'Status', 'Phone']]
    },
    Opportunities: {
      range: 'Opportunities!A1:G1',
      values: [['ID', 'Title', 'Company', 'Amount', 'Stage', 'Probability', 'ExpectedClose']]
    }
  };

  const data = sheetTitles
    .filter(title => headerMap[title])
    .map(title => headerMap[title]);

  if (data.length === 0) return;

  const body = {
    valueInputOption: 'USER_ENTERED',
    data
  };

  await fetchWithToken(updateUrl, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

async function setupHeaders(spreadsheetId: string) {
  await setupHeadersForSheets(spreadsheetId, ['Customers', 'Tickets', 'Tasks', 'Leads', 'Opportunities']);
}

// Generic function to append a row to a specific sheet
export async function insertRow(spreadsheetId: string, sheetName: string, values: any[]) {
  const range = `${sheetName}!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  await fetchWithToken(url, {
    method: 'POST',
    body: JSON.stringify({
      values: [values]
    })
  });
}

// Generic function to get all rows from a sheet
export async function getRows(spreadsheetId: string, sheetName: string): Promise<any[][]> {
  const range = `${sheetName}!A2:Z`; // A2 to skip headers
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const result = await fetchWithToken(url);
  return result.values || [];
}
