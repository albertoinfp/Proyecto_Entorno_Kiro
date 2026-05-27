const fs = require('fs/promises');
const path = require('path');

class ValidadorCSV {
  /**
   * @param {string} rutaCSV - Ruta al archivo CSV con emails
   */
  constructor(rutaCSV) {
    this.rutaCSV = rutaCSV;
    this.emailsValidos = [];
    this.emailsInvalidos = [];
    // Regex estándar para validación de emails
    this.regexEmail = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  }

  /**
   * Lee el CSV, extrae emails y los clasifica en válidos e inválidos.
   * Asume que cada línea del CSV contiene un email (o que el email
   * está en la primera columna si hay varias columnas).
   * @returns {Promise<void>}
   */
  async leerYValidar() {
    const contenido = await fs.readFile(this.rutaCSV, 'utf-8');

    const lineas = contenido
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);

    // Reiniciar listas por si se llama varias veces
    this.emailsValidos = [];
    this.emailsInvalidos = [];

    for (const linea of lineas) {
      // Tomar la primera columna si el CSV tiene varias
      const email = linea.split(',')[0].trim();

      if (this.regexEmail.test(email)) {
        this.emailsValidos.push(email);
      } else {
        this.emailsInvalidos.push(email);
      }
    }
  }

  /**
   * Imprime un reporte en consola con el resumen de la validación.
   */
  imprimirReporte() {
    const total = this.emailsValidos.length + this.emailsInvalidos.length;

    console.log('\n========== REPORTE DE VALIDACIÓN ==========');
    console.log(`Archivo analizado : ${path.basename(this.rutaCSV)}`);
    console.log(`Total de emails   : ${total}`);
    console.log(`✔ Válidos         : ${this.emailsValidos.length}`);
    console.log(`✘ Inválidos       : ${this.emailsInvalidos.length}`);

    if (this.emailsValidos.length > 0) {
      console.log('\n--- Emails válidos ---');
      this.emailsValidos.forEach(e => console.log(`  ✔ ${e}`));
    }

    if (this.emailsInvalidos.length > 0) {
      console.log('\n--- Emails inválidos ---');
      this.emailsInvalidos.forEach(e => console.log(`  ✘ ${e}`));
    }

    console.log('===========================================\n');
  }

  /**
   * Guarda los emails válidos en 'validos.txt'.
   * @returns {Promise<void>}
   */
  async guardarValidos() {
    const contenido = this.emailsValidos.join('\n');
    await fs.writeFile('validos.txt', contenido, 'utf-8');
    console.log(`✔ Emails válidos guardados en "validos.txt" (${this.emailsValidos.length} registros)`);
  }

  /**
   * Guarda los emails inválidos en 'invalidos.txt'.
   * @returns {Promise<void>}
   */
  async guardarInvalidos() {
    const contenido = this.emailsInvalidos.join('\n');
    await fs.writeFile('invalidos.txt', contenido, 'utf-8');
    console.log(`✘ Emails inválidos guardados en "invalidos.txt" (${this.emailsInvalidos.length} registros)`);
  }

  /**
   * Método de conveniencia: ejecuta todo el flujo completo.
   * @returns {Promise<void>}
   */
  async ejecutar() {
    await this.leerYValidar();
    this.imprimirReporte();
    await this.guardarValidos();
    await this.guardarInvalidos();
  }
}

// ─── Ejemplo de uso ───────────────────────────────────────────────────────────
// Crea un CSV de prueba y ejecuta el validador
async function main() {
  const csvPrueba = 'emails.csv';

  // Generar un CSV de ejemplo si no existe
  try {
    await fs.access(csvPrueba);
  } catch {
    const emailsEjemplo = [
      'usuario@ejemplo.com',
      'correo.invalido@',
      'otro@dominio.org',
      '@sinusuario.com',
      'nombre+etiqueta@empresa.es',
      'espacios en medio@correo.com',
      'valido123@subdominio.dominio.net',
      'sindominio',
    ].join('\n');

    await fs.writeFile(csvPrueba, emailsEjemplo, 'utf-8');
    console.log(`Archivo de prueba "${csvPrueba}" creado.`);
  }

  const validador = new ValidadorCSV(csvPrueba);
  await validador.ejecutar();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
