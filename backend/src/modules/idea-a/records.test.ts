import { testRecords } from '../../testing/records-test.js';

testRecords('idea-a', 'DELETE FROM idea_a_records WHERE title = $1');
