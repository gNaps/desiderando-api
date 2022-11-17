import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { User, PasswordToken } from "../models/User";
//import { PasswordToken } from "../models/Passwordtoken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../services/mailService";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

const authController = async (fastify: FastifyInstance) => {
  // Sign up a new user
  fastify.post("/sign-up", async (req: FastifyRequest, rep: FastifyReply) => {
    try {
      const userToSave = { ...(req.body as any) } as any;
      const newUser = new User({
        ...userToSave,
        password: bcrypt.hashSync(userToSave.password, 8),
      });
      await newUser.save();
      rep.code(200).send();
    } catch (error) {
      rep.code(500).send(error);
    }
  });

  // Sign in a user by username and password
  fastify.post("/sign-in", async (req: FastifyRequest, rep: FastifyReply) => {
    try {
      const userToLogin = { ...(req.body as any) } as any;
      const user = await User.findOne({
        username: userToLogin.username,
      });

      if (!user) {
        rep.code(404).send("User or password incorrect!");
        return;
      }

      const isPasswordValid = bcrypt.compareSync(
        userToLogin.password,
        user!.password
      );

      if (!isPasswordValid) {
        rep.code(404).send("User or password incorrect!");
        return;
      }

      const token = jwt.sign(
        {
          id: user!.id,
          username: user!.username,
          email: user!.email,
        },
        process.env.SECRET_KEY_JWT,
        { expiresIn: 86400 }
      );

      rep.code(200).send({
        ...user?.toObject(),
        jwt: token,
      });
    } catch (error) {
      rep.code(500).send(error);
    }
  });

  // Send a request to reset password
  fastify.post(
    "/recovery-password",
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const { email } = req.body as any;

        const user = await User.findOne({
          email,
        });

        const token = await PasswordToken.create({
          email: email,
          user: user.username,
          token: uuidv4(),
        });

        if (user) {
          await sendMail({
            to: email,
            subject: "Recovery password Desiderando",
            html: `Hi ${user.username}! Please use this link to recovery
            your password ${token.token}. The link will expire in 2 hours.`,
          });
        }

        rep.code(200).send();
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );

  // Reset a password
  fastify.post(
    "/reset-password",
    async (req: FastifyRequest, rep: FastifyReply) => {
      const {
        token: tokenRequest,
        newPassword: password,
        username,
      } = req.body as any;
      const token = await PasswordToken.findOne({ token: tokenRequest });

      if (!token && moment(token.expiredAt).diff(moment(), "minutes") < 0) {
        rep.code(401);
      }

      const user = await User.findOne({ username });
      user.password = bcrypt.hashSync(password, 8);
      user.save();

      rep.code(200).send();
    }
  );
};

export default authController;
