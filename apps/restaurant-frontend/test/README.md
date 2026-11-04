# Tests

Зеркало `src/`. Файлы `*.test.js` живут **только здесь**.

```
test/utils/foo.test.js          → src/utils/foo.js
test/services/multikassa/x.test.js → src/services/multikassa/x.js
```

Импорты в тесты: `../../../src/...`

```bash
npm test
```
