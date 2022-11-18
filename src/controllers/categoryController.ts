import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import authHandler from "../handlers/authHandler";
import { Category } from "../models/Category";

const categoryController = async (fastify: FastifyInstance) => {
  // Start the categories
  fastify.post("/", async (req: FastifyRequest, rep: FastifyReply) => {
    const { token } = (req as any).body;
    try {
      if (token !== process.env.SERVER_AUTH_SECRET) {
        rep.code(401).send();
        return;
      }

      await Category.insertMany([
        { name: "Tecnologia e informatica" },
        { name: "Libri e fumetti" },
        { name: "Abbigliamento e accessori" },
        { name: "Arredamento e fai da te" },
        { name: "Collezionismo" },
        { name: "Musica e film" },
        { name: "Sport e hobby" },
      ]);

      rep.code(200).send();
    } catch (error) {
      rep.code(500).send(error);
    }
  });

  // Find all categories
  fastify.get(
    "/",
    { preHandler: [authHandler] },
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        const categories = await Category.find({});
        rep.code(200).send(categories);
      } catch (error) {
        rep.code(500).send(error);
      }
    }
  );
};

export default categoryController;
