import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { User } from "../models/User";
import authHandler from "../handlers/authHandler";
import { Gift } from "../models/Gift";

const friendController = async (fastify: FastifyInstance) => {
  // Add a new friend
  fastify.post(
    "/add",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { user: currentUser } = req as any;
        const { username } = req.body as any;
        const userSender = await User.findById(currentUser.id);
        const userReciever = await User.findOne({ username });

        if (!userSender) {
          rep.code(404).send();
          return;
        }

        if (!userReciever) {
          rep.code(404).send();
          return;
        }

        // Save the user sender
        const userSenderFriends = [
          ...(userSender.friends || []),
          { user: userReciever.id, status: "REQUESTED" },
        ];
        userSender.friends = [...userSenderFriends];
        await userSender.save();

        // Save the user reciever
        const userRecieverFriends = [
          ...(userReciever.friends || []),
          { user: userSender.id, status: "PENDING" },
        ];
        userReciever.friends = [...userRecieverFriends];
        await userReciever.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Remove a friend
  fastify.post(
    "/remove",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { user: currentUser } = req as any;
        const { username } = req.body as any;
        const userSender = await User.findById(currentUser.id);
        const userRemoved = await User.findOne({ username });

        if (!userSender) {
          rep.code(404).send();
          return;
        }

        // Save user sender
        const userSenderFriends = [...(userSender.friends || [])].filter(
          (u) => u.user.toString() !== userRemoved.id
        );
        userSender.friends = [...userSenderFriends];
        await userSender.save();

        // Save user removed
        const userRemovedFriends = [...(userSender.friends || [])].filter(
          (u) => u.user.toString() !== userSender.id
        );
        userRemoved.friends = [...userRemovedFriends];
        await userRemoved.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Get all friends current user
  fastify.get(
    "/",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { user } = req as any;
        const { friends } = await User.findById(user.id).populate(
          "friends.user",
          "username email"
        );

        if (!friends) {
          rep.code(404).send();
          return;
        }

        rep.code(200).send(friends);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Get a single friend by current user
  fastify.get(
    "/:id",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { user } = req as any;
        const friendId = (req.params as any).id;
        const { friends } = await User.findOne({
          _id: user.id,
        }).populate("friends.user", "username email image");

        const friend = friends.find((f) => f.user.id.toString() === friendId);

        if (!friend) {
          rep.code(404).send();
          return;
        }

        const gifts = await Gift.find({
          createdBy: friend.user.id,
        });

        rep.code(200).send({ info: friend, gifts });
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Accept a friend
  fastify.post(
    "/accept",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { user } = req as any;
        const { requestId } = req.body as any;
        const userReciever = await User.findById(user.id);

        if (!userReciever) {
          rep.code(404).send();
          return;
        }

        const requestReciever = userReciever.friends.find(
          (f: any) => f.id.toString() === requestId
        );
        const userSender = await User.findById(requestReciever.user);
        const requestSender = userSender.friends.find(
          (f: any) => f.user.toString() === userReciever.id
        );

        requestReciever.status = "ACCEPTED";
        requestSender.status = "ACCEPTED";

        await userReciever.save();
        await userSender.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );
};

export default friendController;
