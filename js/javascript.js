const URL_BASE = 'https://mindicador.cl/api';
let myChart;

document.addEventListener('DOMContentLoaded', () => {
    obtenerIndicadores();
    document.getElementById('buscar').addEventListener('click', convertirMoneda);
});

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al obtener los datos de la URL: ${url}`);
    }
    return response.json();
}

async function obtenerIndicadores() {
    try {
        const indicadores = await fetchJson(URL_BASE);
        mostrarIndicadoresEnHTML(indicadores);
    } catch (error) {
        console.error('Error al obtener los indicadores económicos:', error.message);
    }
}

async function convertirMoneda() {
    const cantidadPesos = parseFloat(document.getElementById('cantidadPesos').value);
    const monedaDestino = document.getElementById('monedaDestino').value;
    
    if (isNaN(cantidadPesos) || cantidadPesos <= 0) {
        document.getElementById('resultado').textContent = 'Por favor, ingrese una cantidad válida de pesos chilenos.';
        return;
    }
    
    try {
        const data = await fetchJson(`${URL_BASE}/${monedaDestino}`);
        const valorMoneda = data.serie[0].valor;

        if (isNaN(valorMoneda) || valorMoneda <= 0) {
            throw new Error('Valor de la moneda no válido');
        }

        const resultado = cantidadPesos / valorMoneda;
        document.getElementById('resultado').textContent = `Resultado: ${resultado.toFixed(2)} ${monedaDestino.toUpperCase()}`;
        
        await renderizarGrafico(monedaDestino, data);
    } catch (error) {
        console.error('Error al convertir moneda:', error.message);
        document.getElementById('resultado').textContent = 'Seleccione tipo de moneda';
    }
}

async function obtenerDatosUltimos10Dias(data) {
    const ultimos10Dias = data.serie.slice(0, 10);
    return ultimos10Dias.map(dato => ({
        fecha: dato.fecha.substr(0, 10),
        valor: dato.valor,
    }));
}

async function obtenerDatosYCrearGrafico(indicador, data) {
    const datos = await obtenerDatosUltimos10Dias(data);
    if (!datos.length) {
        return { labels: [], datasets: [] };
    }

    const labels = datos.map(dato => dato.fecha);
    const valores = datos.map(dato => dato.valor);

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${indicador.charAt(0).toUpperCase() + indicador.slice(1)} últimos 10 días`,
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgb(75, 192, 192)',
                data: valores,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    };
}

async function renderizarGrafico(indicador, data) {
    const config = await obtenerDatosYCrearGrafico(indicador, data);
    const ctx = document.getElementById('myChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy(); // Destruir el gráfico anterior si existe
    }
    
    myChart = new Chart(ctx, config);
    document.getElementById('myChart').style.backgroundColor = 'white';
}
