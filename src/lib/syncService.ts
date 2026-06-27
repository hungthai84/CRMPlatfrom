import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { initializeDatabase, insertRow, getRows } from './driveDB';

export async function syncDataToDrive(userId?: string, isAdmin?: boolean) {
  const { spreadsheetId } = await initializeDatabase();

  // 1. Fetch customers from Firestore
  let customers: any[] = [];
  try {
    const custRef = collection(db, 'customers');
    const q = (userId && !isAdmin) ? query(custRef, where('ownerId', '==', userId)) : custRef;
    const snap = await getDocs(q);
    customers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error fetching customers from Firestore for Drive Sync:', e);
  }

  // 2. Fetch tickets from Firestore
  let tickets: any[] = [];
  try {
    const tckRef = collection(db, 'tickets');
    const q = (userId && !isAdmin) ? query(tckRef, where('ownerId', '==', userId)) : tckRef;
    const snap = await getDocs(q);
    tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error fetching tickets from Firestore for Drive Sync:', e);
  }

  // 3. Fetch tasks from localStorage
  const savedTasks = localStorage.getItem('crm_kanban_tasks');
  let tasks: any[] = [];
  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks);
    } catch(e) {}
  }

  // 4. Fetch leads from localStorage
  const savedLeads = localStorage.getItem('local_crm_leads');
  let leads: any[] = [];
  if (savedLeads) {
    try {
      leads = JSON.parse(savedLeads);
    } catch (e) {}
  }

  // 5. Fetch opportunities from localStorage
  const savedOpps = localStorage.getItem('crm_opportunities');
  let opportunities: any[] = [];
  if (savedOpps) {
    try {
      opportunities = JSON.parse(savedOpps);
    } catch (e) {}
  }

  // Synchronize Customers
  try {
    const existingCustomers = await getRows(spreadsheetId, 'Customers');
    const existingCustomerIds = new Set(existingCustomers.map(r => r[0]));

    for (const c of customers) {
      if (!existingCustomerIds.has(c.id.toString())) {
        await insertRow(spreadsheetId, 'Customers', [
          c.id, c.name || '', c.phone || '', c.email || '', c.source || '', c.status || '', c.segment || '', c.createdAt || new Date().toISOString()
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing customers to Sheets:', err);
  }

  // Synchronize Tickets
  try {
    const existingTickets = await getRows(spreadsheetId, 'Tickets');
    const existingTicketIds = new Set(existingTickets.map(r => r[0]));

    for (const t of tickets) {
      if (!existingTicketIds.has(t.id.toString())) {
        await insertRow(spreadsheetId, 'Tickets', [
          t.id, t.title || '', t.customerName || '', t.status || '', t.priority || '', t.category || '', t.assignee || '', t.createdAt || new Date().toISOString(), t.updatedAt || ''
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing tickets to Sheets:', err);
  }

  // Synchronize Tasks
  try {
    const existingTasks = await getRows(spreadsheetId, 'Tasks');
    const existingTaskIds = new Set(existingTasks.map(r => r[0]));

    for (const t of tasks) {
      if (!existingTaskIds.has(t.id.toString())) {
        await insertRow(spreadsheetId, 'Tasks', [
          t.id, t.title || '', t.type || '', t.priority || '', t.status || '', t.dueDate || ''
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing tasks to Sheets:', err);
  }

  // Synchronize Leads
  try {
    const existingLeads = await getRows(spreadsheetId, 'Leads');
    const existingLeadIds = new Set(existingLeads.map(r => r[0]));

    for (const l of leads) {
      if (!existingLeadIds.has(l.id.toString())) {
        await insertRow(spreadsheetId, 'Leads', [
          l.id, l.name || '', l.company || '', l.value || 0, l.priority || '', l.status || '', l.phone || ''
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing leads to Sheets:', err);
  }

  // Synchronize Opportunities
  try {
    const existingOpps = await getRows(spreadsheetId, 'Opportunities');
    const existingOppIds = new Set(existingOpps.map(r => r[0]));

    for (const o of opportunities) {
      if (!existingOppIds.has(o.id.toString())) {
        await insertRow(spreadsheetId, 'Opportunities', [
          o.id, o.title || '', o.company || '', o.amount || 0, o.stage || '', o.probability || 0, o.expectedClose || ''
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing opportunities to Sheets:', err);
  }

  return spreadsheetId;
}
