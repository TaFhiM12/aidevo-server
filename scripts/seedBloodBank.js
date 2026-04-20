// Blood bank data seeder for Bangladesh context
// Run this script with: node scripts/seedBloodBank.js


import { MongoClient } from 'mongodb';
import { faker } from '@faker-js/faker';

const uri = "mongodb+srv://aidevo:aidevo.cse.alamSir.just.2021@cluster0.sexese6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const AVAILABILITY = ["available", "limited", "inactive"];
const URGENCY = ["critical", "high", "medium"];
const DISTRICTS = [
  "Dhaka", "Chattogram", "Khulna", "Rajshahi", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
  "Jashore", "Comilla", "Narayanganj", "Gazipur", "Cox's Bazar", "Bogra", "Pabna", "Tangail"
];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }

async function seed() {
  await client.connect();
  const db = client.db();
  const donors = db.collection('bloodDonors');
  const requests = db.collection('bloodRequests');

  await donors.deleteMany({});
  await requests.deleteMany({});

  // Seed donors
  const donorDocs = Array.from({ length: 40 }, (_, i) => {
    const bloodGroup = randomFrom(BLOOD_GROUPS);
    const district = randomFrom(DISTRICTS);
    const status = randomFrom(["approved", "pending", "hidden"]);
    const availabilityStatus = randomFrom(AVAILABILITY);
    const lastDonationAt = Math.random() > 0.5 ? randomDate(new Date(2023, 0, 1), new Date()) : null;
    const latitude = 23.5 + Math.random() * 2; // Bangladesh approx
    const longitude = 89 + Math.random() * 2;
    return {
      name: faker.person.fullName(),
      phone: faker.phone.number('01937492180'),
      bloodGroup,
      address: `${faker.location.streetAddress()}, ${district}`,
      note: Math.random() > 0.7 ? faker.lorem.sentence() : "",
      availabilityStatus,
      preferredContactMethods: [randomFrom(["sms", "whatsapp", "email"])],
      lastDonationAt,
      verified: true,
      location: { type: "Point", coordinates: [longitude, latitude] },
      latitude,
      longitude,
      isActive: true,
      status,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: new Date(),
    };
  });

  // Seed urgent requests
  const requestDocs = Array.from({ length: 15 }, (_, i) => {
    const bloodGroup = randomFrom(BLOOD_GROUPS);
    const district = randomFrom(DISTRICTS);
    const urgencyLevel = randomFrom(URGENCY);
    const status = randomFrom(["pending", "matched", "contacted", "fulfilled", "archived"]);
    const latitude = 23.5 + Math.random() * 2;
    const longitude = 89 + Math.random() * 2;
    return {
      patientName: faker.person.fullName(),
      phone: faker.phone.number('01#########'),
      bloodGroup,
      hospitalAddress: `${faker.location.streetAddress()}, ${district}`,
      note: Math.random() > 0.5 ? faker.lorem.sentence() : "",
      urgencyLevel,
      status,
      notificationChannels: [randomFrom(["sms", "whatsapp", "email"])],
      matchedDonorCount: Math.floor(Math.random() * 3),
      latitude,
      longitude,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: new Date(),
    };
  });

  await donors.insertMany(donorDocs);
  await requests.insertMany(requestDocs);

  console.log('Seeded blood bank donors and requests with realistic Bangladesh data.');
  await client.close();
}

seed();
