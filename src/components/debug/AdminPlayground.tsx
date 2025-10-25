// src/components/debug/AdminPlayground.tsx
'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useLazyListUsersQuery,
  useCreateUserAdminMutation,
  useSetUserRoleMutation,
  useSetUserActiveStatusMutation,
} from '@/store/api/adminApi';
import type { UserRead } from '@/types/user';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Type guard local para errores de RTK Query
function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

// Función auxiliar para mostrar errores de RTK Query
function handleRtkError(e: unknown, where: string) {
  let errorMessage = 'Error inesperado. Ver consola.';
  if (isFetchBaseQueryError(e)) {
    const status = 'status' in e ? e.status : 'desconocido';
    const data = 'data' in e ? (e as FetchBaseQueryError & { data?: unknown }).data : null;
    console.warn(`Error RTKQ @ ${where}`, { status, data });
    // Intenta obtener un mensaje más específico si la API lo envía
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? data.detail
        : JSON.stringify(data);
    errorMessage = `Error ${String(status)}: ${detail}`;
  } else {
    console.warn(`Error desconocido @ ${where}`, e);
  }
  alert(errorMessage);
}

// Props para el componente UserRow
interface UserRowProps {
  user: UserRead;
  onSetRole: (userId: string, makeAdmin: boolean) => Promise<void>;
  onSetActive: (userId: string, active: boolean) => Promise<void>;
  isProcessing: boolean; // Para deshabilitar botones mientras otra acción está en curso
  currentUserId: string | undefined; // Para evitar que el admin se modifique a sí mismo
}

// Componente para renderizar una fila de usuario en la tabla
function UserRow({ user, onSetRole, onSetActive, isProcessing, currentUserId }: UserRowProps) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <tr className="border-b text-sm hover:bg-gray-50 transition-colors">
      {/* Celdas de datos */}
      <td className="px-2 py-1.5 truncate max-w-[100px] text-xs text-gray-500" title={user.id}>
        {user.id.substring(0, 8)}...
      </td>
      <td className="px-2 py-1.5 truncate max-w-xs">{user.email}</td>
      <td className="px-2 py-1.5">{user.full_name ?? '-'}</td>
      <td className="px-2 py-1.5 text-center">{user.is_active ? '✅' : '❌'}</td>
      <td className="px-2 py-1.5 text-center">{user.is_superuser ? '👑' : '👤'}</td>
      {/* Celda de acciones */}
      <td className="px-2 py-1.5 space-x-1 whitespace-nowrap">
        {/* Botón de Rol */}
        <button
          onClick={() => onSetRole(user.id, !user.is_superuser)}
          disabled={isProcessing || isCurrentUser}
          className={`px-2 py-0.5 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            user.is_superuser
              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-400'
              : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400'
          }`}
          title={
            isCurrentUser
              ? 'No puedes cambiar tu propio rol'
              : user.is_superuser
                ? 'Quitar rol de Administrador'
                : 'Convertir en Administrador'
          }
        >
          {user.is_superuser ? 'Quitar Admin' : 'Hacer Admin'}
        </button>

        {/* Botón de Activar/Desactivar */}
        <button
          onClick={() => onSetActive(user.id, !user.is_active)}
          disabled={isProcessing || isCurrentUser}
          className={`px-2 py-0.5 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            user.is_active
              ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-400'
              : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-400'
          }`}
          title={
            isCurrentUser
              ? 'No puedes desactivarte a ti mismo'
              : user.is_active
                ? 'Desactivar Usuario'
                : 'Activar Usuario'
          }
        >
          {user.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  );
}

// Componente Principal del Playground de Administración
export default function AdminPlayground() {
  // Estado global y local
  const currentUser = useAppSelector((state) => state.user.current);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Podría hacerse configurable
  const [hasRequestedUsers, setHasRequestedUsers] = useState(false);

  // Hooks de RTK Query para datos y mutaciones
  const [fetchUsers, { data, error, isLoading, isFetching }] = useLazyListUsersQuery();
  const [createUserAdmin, { isLoading: isCreatingUser, error: createUserError }] =
    useCreateUserAdminMutation();
  const [setUserRole, { isLoading: isSettingRole }] = useSetUserRoleMutation();
  const [setUserActiveStatus, { isLoading: isSettingActive }] = useSetUserActiveStatusMutation();

  // Estado del formulario de creación
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  // Estado derivado para deshabilitar botones durante acciones
  const isProcessingAction = isSettingRole || isSettingActive;

  // Guarda de acceso
  if (!currentUser?.is_superuser) {
    return (
      <section className="border rounded-xl p-4 bg-red-50 text-red-700">
        <h2 className="text-xl font-semibold">Admin Playground</h2>
        <p>Acceso restringido. Debes ser superusuario para ver esta sección.</p>
      </section>
    );
  }

  // Handlers para acciones
  const handleListUsers = async (page = currentPage) => {
    const targetPage = Math.max(1, page);
    setHasRequestedUsers(true);
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
    await fetchUsers({ page: targetPage, page_size: pageSize });
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      alert('Email y contraseña son requeridos.');
      return;
    }
    try {
      await createUserAdmin({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName || null,
        is_superuser: newUserIsAdmin,
      }).unwrap();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserIsAdmin(false);
      alert('Usuario creado exitosamente.');
      if (hasRequestedUsers) {
        const targetPage = currentPage !== 1 ? 1 : currentPage;
        if (targetPage !== currentPage) setCurrentPage(targetPage);
        await handleListUsers(targetPage);
      }
    } catch (err) {
      handleRtkError(err, 'createUserAdmin');
    }
  };

  const handleSetRole = async (userId: string, makeAdmin: boolean) => {
    if (userId === currentUser?.id) {
      alert('No puedes cambiar tu propio rol.');
      return;
    }
    try {
      await setUserRole({ userId, makeAdmin }).unwrap();
      if (hasRequestedUsers) {
        await handleListUsers(currentPage);
      }
    } catch (err) {
      handleRtkError(err, 'setUserRole');
    }
  };

  const handleSetActive = async (userId: string, active: boolean) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivarte a ti mismo.');
      return;
    }
    try {
      await setUserActiveStatus({ userId, active }).unwrap();
      if (hasRequestedUsers) {
        await handleListUsers(currentPage);
      }
    } catch (err) {
      handleRtkError(err, 'setUserActiveStatus');
    }
  };

  // Handlers de paginación
  const handlePrevPage = () => {
    if (!data) return;
    const targetPage = Math.max(1, currentPage - 1);
    if (targetPage === currentPage) return;
    void handleListUsers(targetPage);
  };

  const handleNextPage = () => {
    if (!data) return;
    if (currentPage >= data.pages) return;
    const targetPage = currentPage + 1;
    void handleListUsers(targetPage);
  };

  return (
    <section className="space-y-6 border rounded-xl p-4 bg-white shadow">
      <h2 className="text-xl font-semibold text-gray-800">Admin Playground</h2>

      {/* --- Sección Crear Usuario --- */}
      <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Crear Nuevo Usuario</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          {/* Inputs del formulario */}
          <div className="space-y-1">
            <label htmlFor="new-email" className="text-xs font-medium text-gray-600 block">
              Email (*)
            </label>
            <input
              id="new-email"
              type="email"
              className="w-full border px-3 py-1.5 rounded text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="nuevo@ejemplo.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-xs font-medium text-gray-600 block">
              Contraseña (*)
            </label>
            <input
              id="new-password"
              type="password"
              className="w-full border px-3 py-1.5 rounded text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="********"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-name" className="text-xs font-medium text-gray-600 block">
              Nombre Completo
            </label>
            <input
              id="new-name"
              type="text"
              className="w-full border px-3 py-1.5 rounded text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Juan Perez"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2 pb-1 h-[38px]">
            {' '}
            {/* Altura ajustada */}
            <input
              id="new-is-admin"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={newUserIsAdmin}
              onChange={(e) => setNewUserIsAdmin(e.target.checked)}
            />
            <label htmlFor="new-is-admin" className="text-sm font-medium text-gray-700">
              ¿Es Admin?
            </label>
          </div>
          <button
            onClick={handleCreateUser}
            disabled={isCreatingUser}
            className="w-full border px-3 py-1.5 rounded hover:bg-indigo-100 bg-indigo-50 text-indigo-700 font-medium disabled:opacity-50 text-sm h-[38px] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
        {createUserError && (
          <pre className="text-red-600 text-xs overflow-auto bg-red-50 p-2 rounded mt-2">
            Error al crear: {JSON.stringify(createUserError, null, 2)}
          </pre>
        )}
      </div>

      {/* --- Sección Listar Usuarios --- */}
      <div className="space-y-2 pt-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-semibold text-gray-700">Lista de Usuarios</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleListUsers()}
              disabled={isLoading || isFetching}
              className="text-xs px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading && !data ? 'Cargando...' : 'Listar Usuarios'}
            </button>
            <button
              onClick={() => handleListUsers(currentPage)}
              disabled={!hasRequestedUsers || isFetching}
              className="text-xs px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              {isFetching ? 'Actualizando...' : 'Refrescar'}
            </button>
          </div>
        </div>

        {isLoading && !data && (
          <p className="text-gray-500 italic py-4 text-center">Cargando usuarios...</p>
        )}
        {error && (
          <pre className="text-red-600 text-xs overflow-auto bg-red-50 p-2 rounded">
            Error al cargar usuarios: {JSON.stringify(error, null, 2)}
          </pre>
        )}
        {!hasRequestedUsers && !isLoading && !data && (
          <p className="text-gray-500 text-center py-4 text-sm">
            Usa el botón &quot;Listar Usuarios&quot; para obtener la información.
          </p>
        )}

        {data && data.items.length > 0 && (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Nombre</th>
                  <th className="px-2 py-2 text-center">Activo</th>
                  <th className="px-2 py-2 text-center">Admin</th>
                  <th className="px-2 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onSetRole={handleSetRole}
                    onSetActive={handleSetActive}
                    isProcessing={isProcessingAction}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.items.length === 0 && !isLoading && (
          <p className="text-gray-500 text-center py-4">No se encontraron usuarios.</p>
        )}

        {/* Controles de Paginación */}
        {data && data.total > 0 && (
          <div className="flex justify-between items-center text-sm pt-2 text-gray-600">
            <div>
              Mostrando {data.items.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {(currentPage - 1) * pageSize + data.items.length} de {data.total}. Página{' '}
              {currentPage} de {data.pages}.
            </div>
            <div className="space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isFetching}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= data.pages || isFetching}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
