/**
 * Demo seed — `npm run seed` from server/.
 *
 * Wipes and rebuilds the demo account so the app looks like a real product on
 * first login. Safe to re-run: it deletes the demo user, their friends and
 * everything owned by them before inserting, so it never accumulates
 * duplicates. Only demo-owned documents are touched — other accounts are left
 * alone.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./db");

const User = require("./models/User");
const Timetable = require("./models/Timetable");
const Assignment = require("./models/Assignment");
const Exam = require("./models/Exam");
const Note = require("./models/Note");

const DEMO_EMAIL = "demo@campusmate.app";
const DEMO_PASSWORD = "demo123";
const FRIEND_EMAILS = ["hariharan@campusmate.app", "priya@campusmate.app"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Weekday short name N days from today, matching Timetable.day. */
const dayName = (offset = 0) => DAYS[new Date(Date.now() + offset * 864e5).getDay()];
/** Dates are seeded relative to today so the demo never shows a past exam. */
const daysFromNow = (n) => new Date(Date.now() + n * 864e5);
const isoDay = (offset = 0) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

async function seed() {
  await connectDB();

  // --- wipe anything from a previous run -----------------------------------
  const existing = await User.find({ email: { $in: [DEMO_EMAIL, ...FRIEND_EMAILS] } }, "_id");
  const ids = existing.map((u) => u._id);
  if (ids.length) {
    await Promise.all([
      Timetable.deleteMany({ user: { $in: ids } }),
      Assignment.deleteMany({ user: { $in: ids } }),
      Exam.deleteMany({ user: { $in: ids } }),
      Note.deleteMany({ user: { $in: ids } }),
      User.deleteMany({ _id: { $in: ids } }),
    ]);
  }

  // --- friends (real User docs so /streak/status can populate them) --------
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const friends = await User.create([
    {
      name: "Hariharan C V",
      email: FRIEND_EMAILS[0],
      password,
      roll: "24CS0044",
      dept: "CSE",
      subtitle: "Studied together today",
      streakCount: 9,
      lastActiveDate: isoDay(0),
    },
    {
      name: "Priya S",
      email: FRIEND_EMAILS[1],
      password,
      roll: "24CS0112",
      dept: "CSE",
      subtitle: "Don't break it — study today",
      streakCount: 4,
      lastActiveDate: isoDay(-1),
    },
  ]);

  const demo = await User.create({
    name: "Arjun V",
    email: DEMO_EMAIL,
    password,
    roll: "24CS0081",
    dept: "CSE",
    streakCount: 42,
    lastActiveDate: isoDay(0),
    stats: { notesScanned: 34, aiSummaries: 21, studyDays: 48 },
    friends: friends.map((f) => f._id),
  });
  const user = demo._id;

  // --- timetable: today plus the next two days ----------------------------
  await Timetable.create([
    { user, subject: "DBMS", day: dayName(0), startTime: "09:00", endTime: "11:00", room: "Block A · Lab 3" },
    { user, subject: "OS", day: dayName(0), startTime: "11:00", endTime: "12:00", room: "Room 204" },
    { user, subject: "CN", day: dayName(0), startTime: "14:00", endTime: "15:00", room: "Room 210" },

    { user, subject: "DSA", day: dayName(1), startTime: "09:00", endTime: "10:00", room: "Room 118" },
    { user, subject: "DBMS", day: dayName(1), startTime: "10:00", endTime: "11:00", room: "Room 204" },
    { user, subject: "CN", day: dayName(1), startTime: "13:00", endTime: "15:00", room: "Block C · Lab 1" },

    { user, subject: "OS", day: dayName(2), startTime: "09:00", endTime: "10:00", room: "Room 204" },
    { user, subject: "DSA", day: dayName(2), startTime: "11:00", endTime: "13:00", room: "Block A · Lab 2" },
  ]);

  // --- notes: every one has a real summary so "Summary ready" shows -------
  await Note.create([
    {
      user,
      title: "Binary Search Trees",
      subject: "DSA",
      rawText:
        "Binary Search Tree - every node has at most 2 children. Left subtree keys < node key, right subtree keys > node key. Inorder traversal gives sorted order. Search/insert/delete = O(h) where h is height. Balanced h = log n, worst case (sorted input) h = n so it degenerates to a linked list. AVL and Red-Black trees keep h = O(log n) by rotating on insert.",
      summary:
        "• A BST keeps left-subtree keys smaller and right-subtree keys larger than the node.\n• Inorder traversal of a BST yields the keys in sorted order.\n• Search, insert and delete all cost O(h), where h is the tree height.\n• Balanced: h = O(log n). Worst case (already-sorted input): h = n, degenerating to a linked list.\n• AVL and Red-Black trees restore h = O(log n) using rotations on insert.",
    },
    {
      user,
      title: "Normalization forms",
      subject: "DBMS",
      rawText:
        "1NF - all attribute values atomic, no repeating groups. 2NF - in 1NF and no partial dependency of non-key attribute on part of a composite key. 3NF - in 2NF and no transitive dependency, non-key attr must not depend on another non-key attr. BCNF - stricter 3NF, for every functional dependency X->Y, X must be a superkey. Goal: remove insert/update/delete anomalies and redundancy.",
      summary:
        "• 1NF: every attribute value is atomic — no repeating groups.\n• 2NF: 1NF plus no partial dependency on part of a composite key.\n• 3NF: 2NF plus no transitive dependency between non-key attributes.\n• BCNF: for every functional dependency X → Y, X must be a superkey.\n• The point of normalising is removing redundancy and insert/update/delete anomalies.",
    },
    {
      user,
      title: "Process scheduling",
      subject: "OS",
      rawText:
        "CPU scheduling algorithms. FCFS - first come first served, non preemptive, suffers convoy effect. SJF - shortest job first, optimal average waiting time but needs burst time known in advance. Round Robin - each process gets a time quantum q, preemptive, good response time, q too small = too much context switch overhead. Priority scheduling can starve low priority processes, fix with aging.",
      summary:
        "• FCFS is non-preemptive and simple, but a long job blocks the queue (convoy effect).\n• SJF gives the optimal average waiting time, yet needs burst times known in advance.\n• Round Robin preempts on a time quantum q — good response time, but a small q wastes CPU on context switches.\n• Priority scheduling can starve low-priority processes; aging is the standard fix.",
    },
    {
      user,
      title: "TCP vs UDP",
      subject: "CN",
      rawText:
        "TCP - connection oriented, 3 way handshake SYN SYN-ACK ACK, reliable, ordered delivery, retransmits lost segments, flow control via sliding window, congestion control slow start. Header 20 bytes. UDP - connectionless, no handshake, no retransmission, no ordering, header only 8 bytes, much lower latency. Use TCP for file transfer HTTP email, UDP for video streaming DNS VoIP gaming.",
      summary:
        "• TCP is connection-oriented: a three-way handshake (SYN, SYN-ACK, ACK) precedes any data.\n• TCP guarantees reliable, ordered delivery with retransmission, sliding-window flow control and congestion control.\n• UDP is connectionless, with no handshake, retransmission or ordering.\n• Headers: TCP 20 bytes vs UDP 8 bytes — UDP's lower overhead means lower latency.\n• Use TCP for HTTP, email and file transfer; UDP for streaming, DNS, VoIP and gaming.",
    },
  ]);

  // --- assignments --------------------------------------------------------
  await Assignment.create([
    { user, title: "DBMS ER-diagram record", subject: "DBMS", dueDate: daysFromNow(1), completed: false },
    { user, title: "OS lab observation — scheduling", subject: "OS", dueDate: daysFromNow(3), completed: false },
    { user, title: "CN socket programming assignment", subject: "CN", dueDate: daysFromNow(6), completed: false },
    { user, title: "DSA tutorial sheet 4", subject: "DSA", dueDate: daysFromNow(-1), completed: true },
  ]);

  // --- exams --------------------------------------------------------------
  await Exam.create([
    {
      user,
      subject: "DBMS",
      examName: "Internal 2",
      date: daysFromNow(4),
      startTime: "09:30",
      room: "Hall B",
      syllabus: "Units 3-4: normalization, transactions, indexing",
      topics: [
        { title: "Normalization up to BCNF", done: true },
        { title: "Transactions & ACID properties", done: false },
        { title: "Indexing — B+ trees", done: false },
        { title: "Concurrency control & locking", done: false },
      ],
    },
    {
      user,
      subject: "OS",
      examName: "Internal 2",
      date: daysFromNow(14),
      startTime: "09:30",
      room: "Hall A",
      syllabus: "Units 3-4: scheduling, deadlock, memory management",
      topics: [
        { title: "CPU scheduling algorithms", done: false },
        { title: "Deadlock detection & avoidance", done: false },
        { title: "Paging and segmentation", done: false },
      ],
    },
    {
      user,
      subject: "CN",
      examName: "Internal 2",
      date: daysFromNow(20),
      startTime: "14:00",
      room: "Hall C",
      syllabus: "Units 3-4: transport layer, routing, application layer",
      topics: [
        { title: "TCP vs UDP", done: false },
        { title: "Routing algorithms — distance vector", done: false },
        { title: "DNS and HTTP", done: false },
      ],
    },
  ]);

  console.log("\n  Seeded the CampusMate demo account.\n");
  console.log("    email    :", DEMO_EMAIL);
  console.log("    password :", DEMO_PASSWORD);
  console.log("\n  8 classes · 4 notes · 4 assignments · 3 exams · 2 friends\n");
  await mongoose.disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
