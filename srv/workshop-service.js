const cds = require('@sap/cds');

module.exports = class WorkshopService extends cds.ApplicationService {
    init() {

        const {ServiceOrders} = this.entities;
        const {Tasks} = cds.entities('training.workshop');

        //constante para almacena valor por prioridad de tarea
        const RATES = {S: 40, E: 65, C: 90};

        //antes, durante y despues
        //Created, Read, Updated, Deleted

        this.after('READ', ServiceOrders, async (data, req) => {
            const rows = Array.isArray(data) ? data : [data];

            if (!rows.length || !rows[0]) {
                return;
            }

            //obtener los IDs de las órdenes de servicio
            const missingIds = rows.filter( o => !Array.isArray(o.tasks)).map( o => o.ID);

            //arreglo vacio para organizar las tareas por ID de orden de servicio
            let lookup = {};

            if (missingIds.length) {
                //consulta para obtener las tareas asociadas a las órdenes de servicio
                const items = await SELECT.from(Tasks).where({parent_ID: {in: missingIds}});
                //organizar las tareas por ID de orden de servicio
                lookup = items.reduce((acc, item) => {
                    if (!acc[item.parent_ID]) {
                        acc[item.parent_ID] = [];
                    }
                    acc[item.parent_ID].push(item);
                    return acc;
                }, {});
            } 

            //Recorremos las tareas para acumular el total de horas de cada orden de servicio
            for (const row of rows) {
                //obtenemos la tarea asociada a la orden de servicio, para determinar el total de horas
                const items = Array.isArray(row.tasks) ? row.tasks : lookup[row.ID] || [];
                //sumamos las horas de cada tarea / convertimos a número y si no hay horas, asumimos 0
                const total = items.reduce((acc, item) => acc + Number((item.hours || 0)), 0);
                //asignamos el total de horas a la orden de servicio
                row.totalHours = total;
                //determinamos el costo total de la orden de servicio, multiplicando las horas por la tarifa correspondiente a la prioridad de la tarea
                row.laborCost = total * (RATES[row.priority] || 0);
            }

        });

        return super.init();
    }
};        