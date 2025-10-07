import { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const rawApiUrl = import.meta.env.VITE_API_URL?.trim() ?? '';
  const normalizedBase = rawApiUrl === '' ? '' : rawApiUrl.replace(/\/+$/, '');
  const apiUrl =
    normalizedBase === ''
      ? '/api'
      : normalizedBase.endsWith('/api')
      ? normalizedBase
      : `${normalizedBase}/api`;

  async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
    const response = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, options);
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`Request failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ''}`);
    }
    if (response.status === 204) {
      return null;
    }
    return (await response.json()) as T;
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await request<Todo[]>('/todos');
      setTodos(data ?? []);
    } catch (error) {
      console.error('Failed to fetch todos', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, isCompleted: false }),
      });
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo', error);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      await request(`/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: todo.title, isCompleted: !todo.isCompleted }),
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to toggle todo', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await request(`/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo', error);
    }
  };

  return (
    <div className="app">
      <h1>📝 ToDo App</h1>
      <div className="input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.isCompleted ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => toggleTodo(todo)}
            />
            <span>{todo.title}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
