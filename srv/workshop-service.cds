using training.workshop as workshop from '../db/schema';

service WorkshopService {
    entity ServiceOrders as projection on workshop.ServiceOrders;
    entity Technicians as projection on workshop.Technicians;
    entity Task as projection on workshop.Tasks;
};