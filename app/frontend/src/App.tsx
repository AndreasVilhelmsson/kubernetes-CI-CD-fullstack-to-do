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
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const response = await fetch(`${apiUrl}/api/todos`);
    const data = await response.json();
    setTodos(data);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await fetch(`${apiUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTodo, isCompleted: false }),
    });
    setNewTodo('');
    fetchTodos();
  };

  const toggleTodo = async (todo: Todo) => {
    await fetch(`${apiUrl}/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: todo.title, isCompleted: !todo.isCompleted }),
    });
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    await fetch(`${apiUrl}/api/todos/${id}`, { method: 'DELETE' });
    fetchTodos();
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
