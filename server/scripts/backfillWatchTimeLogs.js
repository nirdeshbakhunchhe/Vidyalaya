import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Progress from '../models/progressModel.js';

async function main() {
  await connectDB();

  const res = await Progress.updateMany(
    { watchTimeLogs: { $exists: false } },
    { $set: { watchTimeLogs: [] } }
  );

  const res2 = await Progress.updateMany(
    { watchTimeLogs: null },
    { $set: { watchTimeLogs: [] } }
  );

  // Some legacy docs might have a non-array value; normalize those too.
  const res3 = await Progress.updateMany(
    { watchTimeLogs: { $not: { $type: 'array' } } },
    { $set: { watchTimeLogs: [] } }
  );

  console.log('Backfill complete:', {
    missingField: res,
    nullField: res2,
    nonArray: res3,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

