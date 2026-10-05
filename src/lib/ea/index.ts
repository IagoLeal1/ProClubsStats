/**
 * Camada de integração com a EA. Todo acesso à EA passa por aqui e roda
 * apenas no servidor (os módulos importam "server-only").
 *
 * O restante da aplicação recebe somente modelos internos (`src/types/`).
 */
export { searchClubs, fetchClubSnapshot } from "./clubs";
export { fetchClubMembers } from "./players";
export { fetchAllRecentMatches, fetchRecentMatches } from "./matches";
export { EAError, isEAError, isEANotFound, type EAErrorKind } from "./errors";
