import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const authHandler = (req: FastifyRequest, rep: FastifyReply, next: any) => {
  const token = req.headers.authorization.replace("Bearer ", "");

  try {
    const data = jwt.verify(token, process.env.SECRET_KEY_JWT);
    if (data) {
      (req as any).user = { ...(data as any) };
      next();
    } else {
      rep.code(403).send();
    }
  } catch (error) {
    rep.code(401).send(error);
  }
};

export default authHandler;
