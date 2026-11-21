import { testRecords } from '../../testing/records-test.js';

testRecords('idea-b', 'DELETE FROM idea_b_records WHERE title = $1');
