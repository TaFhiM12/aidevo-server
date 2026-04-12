import ApiError from "../../utils/ApiError.js";
import userRepository from "./user.repository.js";
import { getCollections } from "../../config/collections.js";
import recommendationService from "../events/event.recommendations.js";

const toObjectIdKey = (value) => String(value);

const getNoShowRisk = (upcomingEventSummaries) => {
  if (!upcomingEventSummaries.length) {
    return {
      level: "low",
      score: 0,
    };
  }

  let weightedRisk = 0;

  upcomingEventSummaries.forEach((event) => {
    if (event.fillRate < 35) {
      weightedRisk += 1;
    } else if (event.fillRate < 60) {
      weightedRisk += 0.5;
    }
  });

  const score = Math.round((weightedRisk / upcomingEventSummaries.length) * 100);

  if (score >= 60) {
    return { level: "high", score };
  }

  if (score >= 30) {
    return { level: "medium", score };
  }

  return { level: "low", score };
};

const getUserByUid = async (uid) => {
  const user = await userRepository.findByUid(uid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getUserById = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getUserRoleByEmail = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userInfo = {
    _id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    uid: user.uid,
  };

  if (user.role === "organization") {
    userInfo.organizationId = user._id.toString();
    userInfo.organizationName = user.organization?.name || "";
    userInfo.type = user.organization?.type || "";
  }

  if (user.role === "student") {
    userInfo.studentId = user._id.toString();
    userInfo.department = user.student?.department || "";
    userInfo.session = user.student?.session || "";
    userInfo.studentNumber = user.student?.studentId || "";
    userInfo.interests = user.student?.interests || "";
  }

  return userInfo;
};

const createUser = async (payload) => {
  const existing = await userRepository.findByEmail(payload.email);

  if (existing) {
    throw new ApiError(400, "User already exists");
  }

  const result = await userRepository.createOne(payload);

  return {
    userId: result.insertedId,
  };
};

const getAllUsers = async () => {
  return userRepository.findAll();
};

const getDashboardStatsByUid = async (uid) => {
  const user = await userRepository.findByUid(uid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { applicationsCollection, membersCollection, eventsCollection } = getCollections();

  if (user.role === "student") {
    const studentId = user._id.toString();

    const [
      totalApplications,
      approvedApplications,
      pendingApplications,
      joinedOrganizations,
      recommendedEvents,
    ] = await Promise.all([
      applicationsCollection.countDocuments({ studentId }),
      applicationsCollection.countDocuments({ studentId, status: "approved" }),
      applicationsCollection.countDocuments({ studentId, status: "pending" }),
      membersCollection.countDocuments({ studentId, status: "active" }),
      recommendationService.getRecommendedEvents(studentId, 6),
    ]);

    return {
      role: "student",
      stats: {
        totalApplications,
        approvedApplications,
        pendingApplications,
        joinedOrganizations,
        recommendedEvents: recommendedEvents.length,
      },
    };
  }

  if (user.role === "organization") {
    const organizationId = user._id.toString();

    const [
      totalEvents,
      totalApplications,
      pendingApplications,
      approvedApplications,
      activeMembers,
    ] = await Promise.all([
      eventsCollection.countDocuments({ organizationEmail: user.email }),
      applicationsCollection.countDocuments({ organizationId }),
      applicationsCollection.countDocuments({ organizationId, status: "pending" }),
      applicationsCollection.countDocuments({ organizationId, status: "approved" }),
      membersCollection.countDocuments({ organizationId, status: "active" }),
    ]);

    return {
      role: "organization",
      stats: {
        totalEvents,
        totalApplications,
        pendingApplications,
        approvedApplications,
        activeMembers,
      },
    };
  }

  return {
    role: user.role,
    stats: {},
  };
};

const getDashboardOverviewByUid = async (uid) => {
  const user = await userRepository.findByUid(uid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { applicationsCollection, membersCollection, eventsCollection } = getCollections();
  const base = await getDashboardStatsByUid(uid);

  if (user.role === "student") {
    const studentId = user._id.toString();

    const [recentApplications, joinedOrganizations, recommendedEvents] = await Promise.all([
      applicationsCollection
        .find({ studentId })
        .project({
          organizationName: 1,
          status: 1,
          appliedAt: 1,
        })
        .sort({ appliedAt: -1 })
        .limit(5)
        .toArray(),
      membersCollection
        .find({ studentId, status: "active" })
        .project({
          organizationName: 1,
          joinedAt: 1,
          organizationId: 1,
        })
        .sort({ joinedAt: -1 })
        .limit(5)
        .toArray(),
      recommendationService.getRecommendedEvents(studentId, 5),
    ]);

    const upcomingRecommendations = recommendedEvents
      .filter((event) => event.startAt && new Date(event.startAt) > new Date())
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 5)
      .map((event) => ({
        _id: event._id,
        title: event.title,
        organization: event.organization,
        startAt: event.startAt,
      }));

    return {
      ...base,
      overview: {
        recentApplications,
        joinedOrganizations,
        upcomingRecommendations,
      },
    };
  }

  if (user.role === "organization") {
    const organizationId = user._id.toString();

    const { eventParticipantsCollection } = getCollections();

    const [recentApplications, upcomingEvents, recentMembers, organizationEvents] = await Promise.all([
      applicationsCollection
        .find({ organizationId })
        .project({
          fullName: 1,
          status: 1,
          appliedAt: 1,
          studentEmail: 1,
        })
        .sort({ appliedAt: -1 })
        .limit(6)
        .toArray(),
      eventsCollection
        .find({
          organizationEmail: user.email,
          startAt: { $gte: new Date().toISOString() },
          status: "active",
        })
        .project({
          title: 1,
          startAt: 1,
          location: 1,
        })
        .sort({ startAt: 1 })
        .limit(5)
        .toArray(),
      membersCollection
        .find({ organizationId, status: "active" })
        .project({
          studentName: 1,
          joinedAt: 1,
        })
        .sort({ joinedAt: -1 })
        .limit(5)
        .toArray(),
      eventsCollection
        .find({ organizationEmail: user.email })
        .project({
          _id: 1,
          title: 1,
          startAt: 1,
          maxCapacity: 1,
          status: 1,
        })
        .toArray(),
    ]);

    const eventIds = organizationEvents.map((event) => event._id);
    const participantCountsRaw = eventIds.length
      ? await eventParticipantsCollection
          .aggregate([
            {
              $match: {
                eventId: { $in: eventIds },
                status: "active",
              },
            },
            {
              $group: {
                _id: "$eventId",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray()
      : [];

    const participantCountMap = new Map(
      participantCountsRaw.map((item) => [toObjectIdKey(item._id), item.count])
    );

    const perEventAttendance = organizationEvents
      .map((event) => {
        const participantCount = participantCountMap.get(toObjectIdKey(event._id)) || 0;
        const capacity = Number(event.maxCapacity || 0);
        const effectiveCapacity = capacity > 0 ? capacity : Math.max(participantCount, 1);
        const fillRate = Math.min(
          100,
          Number(((participantCount / effectiveCapacity) * 100).toFixed(1))
        );

        return {
          eventId: event._id,
          title: event.title,
          startAt: event.startAt,
          status: event.status || "active",
          capacity,
          participantCount,
          fillRate,
        };
      })
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));

    const totalParticipants = perEventAttendance.reduce(
      (sum, event) => sum + event.participantCount,
      0
    );
    const totalEvents = Number(base?.stats?.totalEvents || 0);
    const totalApplications = Number(base?.stats?.totalApplications || 0);
    const averageParticipantsPerEvent =
      totalEvents > 0 ? Number((totalParticipants / totalEvents).toFixed(1)) : 0;
    const perEventConversionRate =
      totalApplications > 0
        ? Number(((totalParticipants / totalApplications) * 100).toFixed(1))
        : 0;

    const nowTs = Date.now();
    const upcomingAttendance = perEventAttendance.filter(
      (event) => event.startAt && new Date(event.startAt).getTime() > nowTs
    );
    const noShowRisk = getNoShowRisk(upcomingAttendance);

    return {
      ...base,
      overview: {
        recentApplications,
        upcomingEvents,
        recentMembers,
        attendanceAnalytics: {
          totalParticipants,
          averageParticipantsPerEvent,
          perEventConversionRate,
          noShowRisk,
        },
        perEventAttendance: perEventAttendance.slice(0, 8),
      },
    };
  }

  return {
    ...base,
    overview: {},
  };
};

const userService = {
  getUserByUid,
  getUserById,
  getUserRoleByEmail,
  getDashboardStatsByUid,
  getDashboardOverviewByUid,
  createUser,
  getAllUsers,
};

export default userService;