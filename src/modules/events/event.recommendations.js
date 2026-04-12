import { getCollections } from "../../config/collections.js";
import { toObjectId } from "../../utils/objectId.js";

// Calculate similarity between two strings (interests, categories, etc.)
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // Partial match
  if (s1.includes(s2) || s2.includes(s1)) return 0.7;

  // Split into words and check overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));

  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  return 0;
};

const normalizeInterests = (studentInterests) => {
  if (!studentInterests) return [];

  if (Array.isArray(studentInterests)) {
    return studentInterests
      .map((interest) => String(interest).trim())
      .filter(Boolean);
  }

  if (typeof studentInterests === "string") {
    return studentInterests
      .split(",")
      .map((interest) => interest.trim())
      .filter(Boolean);
  }

  return [];
};

const compareEventsForRanking = (a, b, scoreKey) => {
  if (b[scoreKey] !== a[scoreKey]) {
    return b[scoreKey] - a[scoreKey];
  }

  const aStartAt = a.startAt ? new Date(a.startAt).getTime() : Number.POSITIVE_INFINITY;
  const bStartAt = b.startAt ? new Date(b.startAt).getTime() : Number.POSITIVE_INFINITY;

  if (aStartAt !== bStartAt) {
    return aStartAt - bStartAt;
  }

  const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;

  return bCreatedAt - aCreatedAt;
};

// Get events student has participated in
const getStudentParticipatedEvents = async (studentId) => {
  const { applicationsCollection, eventsCollection } = getCollections();

  // Find approved applications for the student
  const applications = await applicationsCollection
    .find({
      studentId: toObjectId(studentId),
      status: "approved"
    })
    .toArray();

  if (!applications.length) return [];

  // For each organization, get their events
  const eventCategories = [];

  for (const app of applications) {
    const events = await eventsCollection
      .find({ organization: app.organizationName })
      .toArray();

    events.forEach(event => {
      if (event.organizationType) {
        eventCategories.push(event.organizationType);
      }
    });
  }

  return applications.map(app => ({
    organizationId: app.organizationId,
    organizationName: app.organizationName,
  }));
};

// Calculate recommendation score for an event
const calculateEventScore = (event, studentInterests, participatedOrgs) => {
  let score = 0;
  const interestsList = normalizeInterests(studentInterests);

  // 1. Interest match (40% weight)
  if (interestsList.length > 0) {
    const categoryScore = interestsList.reduce((max, interest) => {
      const similarity = calculateSimilarity(interest, event.organizationType);
      return Math.max(max, similarity);
    }, 0);

    score += categoryScore * 40;
  }

  // 2. Organization participation bonus (30% weight)
  const alreadyParticipating = participatedOrgs.some(
    org => org.organizationId?.toString() === event.organizationId?.toString()
  );

  if (alreadyParticipating) {
    score += 30; // Student has already participated with this org
  }

  // 3. Related category match (20% weight)
  const categoryMatches = participatedOrgs.some(org =>
    calculateSimilarity(org.organizationName, event.organization) > 0.5
  );

  if (categoryMatches) {
    score += 20;
  }

  // 4. Event recency bonus (10% weight)
  if (event.startAt) {
    const eventDate = new Date(event.startAt);
    const now = new Date();
    const daysAway = (eventDate - now) / (1000 * 60 * 60 * 24);

    // Bonus for events in the next 30 days
    if (daysAway > 0 && daysAway <= 30) {
      score += 10;
    }
  }

  return score;
};

// Get recommended events for a student
const getRecommendedEvents = async (studentId, limit = 6) => {
  const { usersCollection, eventsCollection } = getCollections();

  try {
    // Get student profile to find interests
    const student = await usersCollection.findOne(
      { _id: toObjectId(studentId) },
      { projection: { "student.interests": 1 } }
    );

    const studentInterests = student?.student?.interests || "";

    // Get events student has already participated in
    const participatedOrgs = await getStudentParticipatedEvents(studentId);

    // Get all active events
    const allEvents = await eventsCollection
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .toArray();

    // Score and rank events
    const scoredEvents = allEvents
      .map(event => ({
        ...event,
        _score: calculateEventScore(event, studentInterests, participatedOrgs),
      }))
      .filter(event => event._score > 0) // Only include events with some relevance
      .sort((a, b) => compareEventsForRanking(a, b, "_score"))
      .slice(0, limit);

    // Remove score from final output
    return scoredEvents.map(({ _score, ...event }) => event);
  } catch (error) {
    console.error("Error calculating recommendations:", error);
    throw error;
  }
};

// Get trending events (most applied by students with similar interests)
const getTrendingEvents = async (studentInterests, limit = 6) => {
  const { eventsCollection, applicationsCollection } = getCollections();

  try {
    const allEvents = await eventsCollection
      .find({ status: "active" })
      .toArray();

    if (!allEvents.length) {
      return [];
    }

    const interestsList = normalizeInterests(studentInterests);

    const applicationCounts = await Promise.all(
      allEvents.map((event) =>
        applicationsCollection.countDocuments({
          organizationName: event.organization,
          status: "approved",
        })
      )
    );

    const maxApplicationCount = Math.max(...applicationCounts, 1);

    // For each event, count applications
    const eventsWithApplicationCount = allEvents.map((event, index) => {
      const applicationCount = applicationCounts[index];
      const normalizedPopularity = (applicationCount / maxApplicationCount) * 100;
      const interestSimilarity = interestsList.length
        ? interestsList.reduce(
            (max, interest) =>
              Math.max(max, calculateSimilarity(interest, event.organizationType)),
            0
          )
        : 0;

      return {
        ...event,
        applicationCount,
        _trendScore: (normalizedPopularity * 0.7) + (interestSimilarity * 100 * 0.3),
      };
    });

    return eventsWithApplicationCount
      .filter(event => event._trendScore > 0)
      .sort((a, b) => compareEventsForRanking(a, b, "_trendScore"))
      .slice(0, limit)
      .map(({ _trendScore, applicationCount, ...event }) => event);
  } catch (error) {
    console.error("Error fetching trending events:", error);
    throw error;
  }
};

const recommendationService = {
  getRecommendedEvents,
  getTrendingEvents,
  calculateEventScore,
};

export default recommendationService;
