'use strict';

const { advisors, homes, clients, cutoff } = window.RealEstate;
const $ = id => document.getElementById(id);
const homeMap = new Map(homes.map(home => [home.id, home]));
const moneyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0
});
const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' });
const money = value => moneyFormatter.format(value);
const date = value => value ? dateFormatter.format(new Date(value + 'T12:00:00')) : '—';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const isOverdue = client => client.nextContact && client.nextContact < cutoff;
const statusClasses = {
    Vendida: 'sold', 'En proceso': 'progress', 'Visita programada': 'visit',
    Rechazada: 'rejected', Disponible: 'available', Apartada: 'reserved'
};
const propertyFilterIds = ['propertyType', 'maxPrice', 'bedrooms', 'availability', 'propertySearch'];
const carteraTitle = $('viewTitle').innerHTML;
const carteraDescription = $('viewDescription').textContent;
let previousFocus;


function badge(status) {
    return `<span class="badge ${statusClasses[status]}">${status}</span>`;
}

function illustration(home) {
    const type = home.type === 'Casa' ? 'house' : 'apartment';
    return `<div class="home-art ${type}" aria-hidden="true">
        <span class="art-orbit"></span>
        <span class="art-building"><i></i><i></i><i></i><i></i></span>
        <span class="art-tree"></span><small>ILUSTRACIÓN</small>
    </div>`;
}

function renderFeatures(home) {
    return `<div class="features">${home.features.map(feature => `<span>${feature}</span>`).join('')}</div>`;
}

function renderHomeHeading(home) {
    return `<div class="property-top"><span>${home.id} · ${home.type}</span>${badge(home.availability)}</div>`;
}

function filterClients(group) {
    const status = $('clientStatus').value;
    const query = normalize($('clientSearch').value.trim());
    return group.filter(client => {
        const home = homeMap.get(client.home);
        const searchable = normalize(`${client.id} ${client.name} ${client.home} ${home.address}`);
        return (!status || client.status === status) && searchable.includes(query);
    });
}

function renderMetrics(group) {
    const sold = group.filter(client => client.status === 'Vendida');
    const amount = sold.reduce((sum, client) => sum + homeMap.get(client.home).price, 0);
    $('totalClients').textContent = group.length;
    $('soldClients').textContent = sold.length;
    $('soldAmount').textContent = `${money(amount)} en vivienda`;
    $('pendingClients').textContent = group.filter(client => client.nextContact).length;
    $('overdueClients').textContent = group.filter(isOverdue).length;
}

function renderClientRow(client) {
    const home = homeMap.get(client.home);
    const overdue = isOverdue(client);
    return `<tr>
        <td><strong>${client.name}</strong><small>${client.id}</small></td>
        <td><button class="home-link" data-home="${home.id}">${home.id} ↗</button></td>
        <td>${home.address}</td>
        <td class="price-cell">${money(home.price)}</td>
        <td>${badge(client.status)}</td>
        <td>${date(client.lastContact)}</td>
        <td class="${overdue ? 'overdue' : ''}">${date(client.nextContact)}${overdue ? '<small>Vencido</small>' : ''}</td>
        <td>${client.note}</td>
    </tr>`;
}

function renderClients() {
    const advisor = Number($('advisor').value);
    const group = clients.filter(client => client.advisor === advisor);
    const filtered = filterClients(group);

    renderMetrics(group);
    $('advisorTitle').textContent = advisors[advisor];
    $('clientCount').textContent = `${filtered.length} de ${group.length} clientes`;
    $('clientRows').innerHTML = filtered.map(renderClientRow).join('');
    $('clientEmpty').hidden = filtered.length > 0;
    $('clientTableScroll').hidden = filtered.length === 0;
}

function filterHomes() {
    const type = $('propertyType').value;
    const maxPrice = Number($('maxPrice').value);
    const bedrooms = Number($('bedrooms').value);
    const availability = $('availability').value;
    const query = normalize($('propertySearch').value.trim());
    return homes.filter(home =>
        home.availability !== 'Vendida' &&
        (!type || home.type === type) &&
        (!maxPrice || home.price <= maxPrice) &&
        (!bedrooms || home.bedrooms >= bedrooms) &&
        (!availability || home.availability === availability) &&
        normalize(`${home.id} ${home.address}`).includes(query)
    );
}

function renderHomeCard(home) {
    const land = home.land ? `${home.land} m² de terreno` : 'Terreno compartido';
    return `<article class="property-card">
        ${illustration(home)}
        <div class="property-body">
            ${renderHomeHeading(home)}
            <h3>${money(home.price)}</h3><p class="address">${home.address}</p>
            <div class="specs">
                <span><b>${home.bedrooms}</b> recámaras</span>
                <span><b>${home.bathrooms}</b> baños</span>
                <span><b>${home.parking}</b> estac.</span>
            </div>
            <p class="area">${home.construction} m² de construcción · ${land}</p>
            ${renderFeatures(home)}
            <button class="detail-button" data-home="${home.id}">Ver ficha de vivienda <span>↗</span></button>
        </div>
    </article>`;
}

function renderHomes() {
    const filtered = filterHomes();
    $('propertyCount').textContent = `${filtered.length} viviendas`;
    $('propertyGrid').innerHTML = filtered.length
        ? filtered.map(renderHomeCard).join('')
        : '<p class="empty">No hay viviendas con estas características. Prueba ampliar los filtros.</p>';
}

function renderDetailSpecs(home) {
    const specs = [
        ['Recámaras', home.bedrooms], ['Baños', home.bathrooms],
        ['Estacionamientos', home.parking], ['Construcción', `${home.construction} m²`],
        ['Terreno', home.land ? `${home.land} m²` : 'Compartido']
    ];
    return `<dl class="detail-specs">${specs.map(([label, value]) =>
        `<div><dt>${label}</dt><dd>${value}</dd></div>`
    ).join('')}</dl>`;
}

function renderRelatedClients(home) {
    return clients.filter(client => client.home === home.id).map(client => `
        <div class="related-client">
            <div><strong>${client.name}</strong><small>Asesor: ${advisors[client.advisor]}</small></div>
            ${badge(client.status)}
        </div>`).join('');
}

function renderHomeDetail(home) {
    return `${illustration(home)}<div class="detail-content">
        ${renderHomeHeading(home)}
        <h2 id="dialogTitle">${money(home.price)}</h2><p>${home.address}</p>
        ${renderDetailSpecs(home)}${renderFeatures(home)}
        <h3>Clientes vinculados</h3>${renderRelatedClients(home)}
    </div>`;
}

function openHome(id) {
    const home = homeMap.get(id);
    if (!home) return;
    previousFocus = document.activeElement;
    $('propertyDetail').innerHTML = renderHomeDetail(home);
    $('propertyDialog').showModal();
    $('propertyDialog').scrollTop = 0;
    $('closeDialog').focus();
}

function closeOnBackdrop(event) {
    const dialog = $('propertyDialog');
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
}

function setView() {
    const inventory = location.hash === '#viviendas';
    const view = inventory ? 'viviendas' : 'cartera';
    $('carteraView').hidden = inventory;
    $('viviendasView').hidden = !inventory;
    document.querySelectorAll('[data-view]').forEach(link => {
        if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    $('viewTitle').innerHTML = inventory
        ? 'Viviendas disponibles.' : carteraTitle;
    $('viewDescription').textContent = inventory
        ? 'Encuentra opciones para tus clientes y consulta sus características y disponibilidad.'
        : carteraDescription;
}

function resetFilters(ids, render) {
    ids.forEach(id => { $(id).value = ''; });
    render();
}

function bindEvents() {
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-home]');
        if (trigger) openHome(trigger.dataset.home);
    });
    $('closeDialog').addEventListener('click', () => $('propertyDialog').close());
    $('propertyDialog').addEventListener('click', closeOnBackdrop);
    $('propertyDialog').addEventListener('close', () => previousFocus?.focus());
    window.addEventListener('hashchange', setView);
    ['advisor', 'clientStatus'].forEach(id => $(id).addEventListener('change', renderClients));
    $('clientSearch').addEventListener('input', renderClients);
    propertyFilterIds.forEach(id => {
        const event = id === 'propertySearch' ? 'input' : 'change';
        $(id).addEventListener(event, renderHomes);
    });
    $('resetClients').addEventListener('click', () => resetFilters(['clientStatus', 'clientSearch'], renderClients));
    $('resetProperties').addEventListener('click', () => resetFilters(propertyFilterIds, renderHomes));
}

$('advisor').innerHTML = advisors.map((name, index) => `<option value="${index}">${name}</option>`).join('');
bindEvents();
renderClients();
renderHomes();
setView();
