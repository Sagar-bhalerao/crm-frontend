import { http } from "./http";

export const listOutlets = () => http("/outlets");
export const listBrands = () => http("/brands");
export const listAssignees = (outletId) => http(`/outlets/${outletId}/assignees`);
export const listSalesTeam = () => http("/users/sales-team");
export const listUsers = () => http("/users");
export const listRoles = () => http("/roles");
