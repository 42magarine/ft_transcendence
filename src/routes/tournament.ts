// import { FastifyInstance } from "fastify";
// import { authenticate } from "../backend/middleware/security.js";


// export default async function (fastify: FastifyInstance) {
//     const tournamentController = new TournamentController();


//     fastify.get("/tournament/ws", {websocket: true}, (connection, request) =>
//     {
//         const userId = request.user?.id;
//         tournamentController.handleConnection(connection, userId)
//     })

//     fastify.route({
//         method: 'GET',
//         url: '/tournament/lobbies',
//         preHandler: authenticate,
//         handler: tournamentController.getLobbies.bind(tournamentController)
//     })




// }