
(function () {
    const advisors = ['Mariana Salinas', 'Javier Cárdenas', 'Lorena Pacheco', 'Ricardo Valdés', 'Adriana Campos'];
    const first = ['Claudia', 'Roberto', 'Patricia', 'Fernando', 'Mónica', 'Eduardo', 'Gabriela', 'Arturo', 'Verónica', 'Sergio', 'Alejandra', 'Héctor', 'Cecilia', 'Raúl', 'Daniela', 'Enrique', 'Lucía', 'Óscar', 'Teresa', 'Andrés'];
    const last = ['Mendoza', 'Ríos', 'Aguilar', 'Soto', 'Cervantes', 'Fuentes', 'Navarro', 'Delgado', 'Vargas', 'Molina', 'Castillo', 'Paredes', 'Silva', 'Ortega', 'Morales', 'León', 'Estrada', 'Reyes', 'Ibarra', 'Vega'];
    const second = ['Benítez', 'Carrillo', 'Montes', 'Rojas', 'Serrano', 'Rosales', 'Vázquez', 'Solís', 'Cortés', 'Aguirre', 'Franco', 'Arias', 'Ochoa', 'Lara', 'Trejo', 'Peña', 'Durán', 'Santos', 'Medina', 'Villalobos'];
    const streets = ['Calle Fresno', 'Calle Azucena', 'Privada del Olmo', 'Calle Naranjo', 'Calle Alhelí', 'Paseo de los Sauces', 'Calle Jacaranda', 'Calle Cedro', 'Privada Laurel', 'Calle Magnolia'];
    const colonies = ['Col. Las Arboledas', 'Col. Jardines del Valle', 'Col. Lomas del Encino', 'Col. Los Olivos', 'Col. Vista del Parque'];
    const statuses = ['Vendida', 'En proceso', 'Visita programada', 'Rechazada'];
    const notes = { Vendida: ['Escritura firmada; entrega de llaves realizada.', 'Operación cerrada con crédito bancario.', 'Entrega de documentos concluida.'], 'En proceso': ['Espera aprobación de crédito.', 'Solicita desglose de gastos de escrituración.', 'Revisa la propuesta con su familia.', 'Pendiente de enviar comprobante de ingresos.'], 'Visita programada': ['Visita por la tarde; acudirá con su pareja.', 'Solicita revisar iluminación y distribución.', 'Segunda visita para medir la recámara principal.'], Rechazada: ['El precio supera el presupuesto disponible.', 'Prefiere una zona más cercana a su trabajo.', 'Requiere una recámara adicional.'] };
    const cutoff = '2026-09-21';

    const portfolios = [[7, 11, 6, 3], [3, 7, 5, 3], [6, 8, 6, 3], [2, 4, 5, 3], [4, 6, 3, 5]];
    let seed = 20260921;
    function randomInt(limit) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return Math.floor((seed / 4294967296) * limit);
    }
    function shuffle(values) {
        for (let i = values.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [values[i], values[j]] = [values[j], values[i]];
        }
        return values;
    }
    function dateAtOffset(days) {
        const date = new Date(cutoff + 'T12:00:00Z');
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }
    notes.Vendida.push('Firma y pago final confirmados.', 'Compra de contado concluida; expediente archivado.');
    notes['En proceso'].push('Compara dos opciones de financiamiento.', 'Pendiente de avalúo para continuar el trámite.', 'Solicita revisar la propuesta antes de reservar.');
    notes['Visita programada'].push('Primera visita; quiere conocer los espacios de trabajo.', 'Recorrido acordado para revisar accesos y estacionamiento.', 'Solicita comparar distribución con otra vivienda.');
    notes.Rechazada.push('Pospone la compra hasta el siguiente año.', 'Necesita más espacios de estacionamiento.');
    const homes = [], clients = [];
    portfolios.forEach((counts, a) => {
        const assignedStatuses = shuffle(counts.flatMap((count, index) => Array(count).fill(statuses[index])));
        assignedStatuses.forEach(status => {
        const n = clients.length;
        const type = randomInt(3) === 0 ? 'Departamento' : 'Casa';
        const home = {
            id: 'VIV-' + String(n + 1).padStart(3, '0'), type, address: streets[n % 10] + ' ' + (112 + n * 7) + (type === 'Departamento' ? ', Depto. ' + (101 + n % 8) : '') + ', ' + colonies[Math.floor(n / 10) % 5],
            price: 1450000 + (n * 137000) % 3900000, bedrooms: 2 + n % 3, bathrooms: 1.5 + (n % 4) * .5, parking: 1 + n % 2, construction: 86 + (n * 11) % 155, land: type === 'Casa' ? 160 + (n * 17) % 180 : null,
            features: type === 'Casa' ? ['Patio de servicio', n % 2 ? 'Jardín privado' : 'Terraza', 'Cocina integral'] : ['Acceso controlado', n % 2 ? 'Balcón' : 'Elevador', 'Cocina integral'],
            availability: status === 'Vendida' ? 'Vendida' : status === 'En proceso' && randomInt(3) === 0 ? 'Apartada' : 'Disponible', advisor: a
        };
        if (home.land) home.land = Math.max(home.land, home.construction + 35); homes.push(home);
        const closed = status === 'Vendida' || status === 'Rechazada';
        const nextOffset = randomInt(25) - 8;
        const lastOffset = closed ? -randomInt(48) : Math.min(0, nextOffset) - 1 - randomInt(16);
        clients.push({
            id: 'CLI-' + String(n + 1).padStart(3, '0'), advisor: a, name: first[n % 20] + ' ' + last[(n * 3 + Math.floor(n / 20) * 7) % 20] + ' ' + second[(n * 7 + a * 3) % 20], home: home.id, status,
            lastContact: dateAtOffset(lastOffset), nextContact: closed ? null : dateAtOffset(nextOffset), note: notes[status][randomInt(notes[status].length)]
        });
        });
    });
    window.RealEstate = { advisors, homes, clients, cutoff };
}());


