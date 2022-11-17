import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Gift, IGift } from "../models/Gift";
import authHandler from "../handlers/authHandler";
import {
  checkIfBase64,
  deleteImage,
  uploadImage,
} from "../services/cloudinaryService";
import { User } from "../models/User";
import * as getSize from "image-size-from-base64";

const giftController = async (fastify: FastifyInstance) => {
  // Find all desideri for current user
  fastify.get(
    "/",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      const { user } = req as any;
      try {
        const gifts = await Gift.find({
          createdBy: user.id,
        }).populate("createdBy", { id: 1, username: 1, email: 1 });
        rep.code(200).send(gifts);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Find one desiderio
  fastify.get(
    "/:id",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      const { user: currentUser } = req as any;
      const { id } = (req as any).params;
      try {
        const user = await User.findById(currentUser.id);
        const friends = user.friends.map((f: any) => f.user);
        const gift = await Gift.findById(id).populate("createdBy", {
          id: 1,
          username: 1,
          email: 1,
        });

        const canRead =
          gift.createdBy.id === currentUser.id ||
          friends.some((f) => f.id === gift.createdBy.id);

        if (!canRead) {
          rep.code(404).send();
          return;
        }

        rep.code(200).send(gift);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Dashboard query desideri
  fastify.get(
    "/dashboard",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      const { user: currentUser } = req as any;
      try {
        const user = await User.findById(currentUser.id);
        const friends = user.friends.map((f: any) => f.user);
        const gifts = await Gift.find({
          createdBy: { $in: friends },
          giftBy: undefined,
        })
          .populate("createdBy", { id: 1, username: 1, email: 1 })
          .sort([["createdAt", -1]])
          .limit(50);

        rep.code(200).send(gifts);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Create new desiderio
  fastify.post(
    "/",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const gift = { ...(req.body as any) };
        const { user } = req as any;

        if (gift.image) {
          let size = await getSize.default(gift.image);
          if (size >= 2000) {
            rep.code(400).send("Image too big");
            return;
          }
          const imageUrl = await uploadImage(gift.image, "desiderando/gifts");
          gift.image = imageUrl;
        }

        gift.createdAt = new Date();
        gift.createdBy = user.id;
        const newGift = new Gift(gift);
        await newGift.save();
        rep.code(200).send(newGift);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Update a new desiderio
  fastify.put(
    "/:id",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { id }: any = req.params;
        const { user } = req as any;
        const gift: IGift = req.body as IGift;
        const giftToUpdate = await Gift.findById(id);

        if (!giftToUpdate || giftToUpdate.createdBy.toString() !== user.id) {
          rep.code(404).send();
          return;
        }

        if (gift.image && !checkIfBase64(gift.image)) {
          let size = await getSize.default(gift.image);
          if (size >= 2000) {
            rep.code(400).send("Image too big");
            return;
          }
          if (giftToUpdate.image) {
            await deleteImage(giftToUpdate.image);
          }
          gift.image = await uploadImage(gift.image, "desiderando/gifts");
        } else if (!gift.image && giftToUpdate.image) {
          await deleteImage(giftToUpdate.image);
        }

        gift.updatedAt = new Date();
        await giftToUpdate.update(gift);
        const giftUpdated = await Gift.findById(id);
        rep.code(200).send(giftUpdated);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Delete a desiderio
  fastify.delete(
    "/:id",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { id }: any = req.params;
        const { user } = req as any;
        const giftToDelete = await Gift.findById(id);

        if (!giftToDelete || giftToDelete.createdBy.toString() !== user.id) {
          rep.code(404).send();
          return;
        }

        await giftToDelete.delete();

        if (giftToDelete.image) {
          await deleteImage(giftToDelete.image);
        }

        rep.code(200).send(giftToDelete);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Book a desiderio
  fastify.put(
    "/:id/book",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { id }: any = req.params;
        const { user: currentUser } = req as any;
        const gift: IGift = req.body as IGift;
        const giftToBooking = await Gift.findById(id);
        const user = await User.findById(currentUser.id);
        const userFriends = user.friends.map((f) => f.user);

        if (!giftToBooking) {
          rep.code(404).send();
          return;
        }

        const canBook = userFriends.some(
          (uf) => uf.toString() === giftToBooking.createdBy.toString()
        );

        if (!canBook) {
          rep.code(403).send();
          return;
        }

        giftToBooking.giftBy = currentUser.id;
        giftToBooking.giftedAt = new Date();
        await giftToBooking.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Unbook a desiderio
  fastify.put(
    "/:id/unbook",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { id }: any = req.params;
        const { user: currentUser } = req as any;
        const gift: IGift = req.body as IGift;
        const giftToBooking = await Gift.findById(id);
        const user = await User.findById(currentUser.id);
        const userFriends = user.friends.map((f) => f.user);

        if (!giftToBooking) {
          rep.code(404).send();
          return;
        }

        const canBook = userFriends.some(
          (uf) => uf.toString() === giftToBooking.createdBy.toString()
        );

        if (!canBook) {
          rep.code(404).send();
          return;
        }

        giftToBooking.giftBy = undefined;
        giftToBooking.giftedAt = undefined;
        await giftToBooking.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );
};

export default giftController;
