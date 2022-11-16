import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import authHandler from "../handlers/authHandler";
import { deleteImage, uploadImage } from "../services/cloudinaryService";
import * as getSize from "image-size-from-base64";

const userController = async (fastify: FastifyInstance) => {
  fastify.post(
    "/",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { password, confirmPassword, newPassword, username } =
          req.body as any;

        if (password !== confirmPassword) {
        }

        const user = await User.findById((req as any).user.id);

        if (!user) {
          rep.code(404).send("User not found!");
        }

        const isPasswordValid = bcrypt.compareSync(password, user!.password);

        if (!isPasswordValid) {
          rep.code(404).send("Password incorrect!");
        }

        user.password = bcrypt.hashSync(newPassword, 8);
        await user.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Get info about current user
  fastify.get(
    "/me",
    { preHandler: authHandler },
    async (req: FastifyRequest, rep: FastifyReply) => {
      const { user } = req as any;
      try {
        const userInfo = await User.findById(user.id, "username email age sex");
        rep.code(200).send(userInfo);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Upload new image user
  fastify.post(
    "/upload",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const user = await User.findById((req as any).user.id);
        const { image } = (req as any).body;

        let size = await getSize.default(image);

        if (size >= 2000) {
          rep.code(400).send("Image too big");
          return;
        }

        if (user.image) {
          await deleteImage(user.image);
        }

        user.image = await uploadImage(image, "desiderando/users");
        await user.save();

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );
};

export default userController;
