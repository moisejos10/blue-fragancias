const assert = require("node:assert/strict");
const test = require("node:test");
const { loadConfig } = require("../src/config");

function validEnvironment() {
  return {
    PGHOST: "127.0.0.1",
    PGPORT: "5432",
    PGDATABASE: "blue_fragancias_test",
    PGUSER: "blue_fragancias_app",
    PGPASSWORD: "contraseña ficticia exclusiva de la prueba",
  };
}

test("rechaza configuración incompleta sin revelar valores privados", () => {
  for (const name of ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
    for (const value of [undefined, "", "   "]) {
      const environment = { ...validEnvironment(), [name]: value };
      assert.throws(() => loadConfig(environment), (error) => {
        assert.match(error.message, new RegExp(name));
        assert.doesNotMatch(error.message, /ficticia|blue_fragancias_test|127\.0\.0\.1/);
        return true;
      });
    }
  }
});

test("impide utilizar postgres u otro usuario distinto del rol limitado", () => {
  for (const user of ["postgres", " postgres ", "otro_administrador"]) {
    assert.throws(
      () => loadConfig({ ...validEnvironment(), PGUSER: user }),
      /PGUSER debe usar el rol limitado blue_fragancias_app/,
    );
  }
});

test("rechaza puertos inválidos en HTTP y PostgreSQL", () => {
  for (const name of ["PORT", "PGPORT"]) {
    for (const value of ["0", "65536", "-1", "3.5", "5432extra", "1e3", "", " 5432 "]) {
      assert.throws(() => loadConfig({ ...validEnvironment(), [name]: value }));
    }
  }
});

test("conserva la contraseña exacta y permite un puerto HTTP explícito", () => {
  const password = " espacios que forman parte de la contraseña ";
  const config = loadConfig({
    ...validEnvironment(),
    PGPASSWORD: password,
    PORT: "3100",
  });

  assert.equal(config.database.password, password);
  assert.equal(config.database.port, 5432);
  assert.equal(config.port, 3100);
  assert.equal(loadConfig(validEnvironment()).port, 3000);
});
