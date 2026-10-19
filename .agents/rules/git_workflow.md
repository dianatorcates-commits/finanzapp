# Regla Obligatoria: Flujo de Trabajo Git con Ramas

Para cada requerimiento, corrección o funcionalidad solicitada en FinanzApp, se DEBE seguir estrictamente el Ciclo de Desarrollo Estándar definido en `docs/AGENT_INSTRUCTIONS.md`:

## Ciclo de Desarrollo Estándar:

1. **Crear y cambiar a una rama de funcionalidad**:
   ```bash
   git checkout main
   git checkout -b feature/nombre-de-la-funcionalidad  # o fix/nombre-del-bug
   ```

2. **Implementar y verificar compilación**:
   Antes de hacer commit, ejecutar siempre:
   ```bash
   npm run build
   ```
   *Si `npm run build` o `tsc` falla, corregir los errores de tipos antes de continuar.*

3. **Commit y Push a la rama**:
   ```bash
   git add .
   git commit -m "Mensaje descriptivo en español o inglés"
   git push origin feature/nombre-de-la-funcionalidad
   ```

4. **Fusión a `main` y despliegue**:
   ```bash
   git checkout main
   git merge feature/nombre-de-la-funcionalidad
   git push origin main
   ```
   *(Al hacer push a `main`, Vercel desplegará automáticamente la nueva versión).*
