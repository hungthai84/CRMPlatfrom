import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

// Note: This is an illustrative test file. In the real environment, 
// we use the deploy_firebase tool to verify rules against the emulator/live project.

describe('CRM Firestore Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0534711773',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('denies unauthenticated access to customers', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('customers').get());
  });

  it('allows owner to read their customers', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.collection('customers').where('ownerId', '==', 'alice').get());
  });

  it('denies user from reading others customers', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    // We assume there is a doc owned by alice
    await assertFails(bobDb.collection('customers').doc('alice_doc').get());
  });
});
