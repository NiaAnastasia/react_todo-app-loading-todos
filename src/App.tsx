/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect } from 'react';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import cn from 'classnames';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const todoFieldRef = React.useRef<HTMLInputElement>(null);

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  useEffect(() => {
    const loadTodos = async () => {
      setErrorMessage('');

      try {
        const data = await todoService.getTodos();

        setTodos(data);
      } catch {
        showError('Unable to load todos');
      }
    };

    loadTodos();
    todoFieldRef.current?.focus();
  }, []);

  const visibleTodos = todos.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  const hadleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setErrorMessage('');

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      showError('Title should not be empty');

      return;
    }

    setIsLoading(true);

    const newTempTodo = {
      id: 0,
      userId: todoService.USER_ID,
      title: trimmedQuery,
      completed: false,
    };

    setTempTodo(newTempTodo);

    try {
      const newTodo = await todoService.createTodo(trimmedQuery);

      setTodos(prev => [...prev, newTodo]);
      setQuery('');
    } catch {
      showError('Unable to add a todo');
      todoFieldRef.current?.focus();
    } finally {
      setIsLoading(false);
      setTempTodo(null);
    }
  };

  const removeTodo = async (todoId: number) => {
    setErrorMessage('');
    setLoadingIds(prev => [...prev, todoId]);
    try {
      await todoService.deleteTodo(todoId);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch {
      showError('Unable to delete a todo');
      setLoadingIds(prev => prev.filter(id => id !== todoId));
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== todoId));
    }
  };

  const toggleTodo = async (todo: Todo) => {
    setErrorMessage('');
    setLoadingIds(prev => [...prev, todo.id]);

    try {
      const updatedTodo = await todoService.updateTodo(todo.id, {
        completed: !todo.completed,
      });

      setTodos(prev => prev.map(t => (t.id === todo.id ? updatedTodo : t)));
    } catch {
      showError('Unable to update a todo');
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== todo.id));
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className={cn('todoapp__toggle-all', {
              active: todos.length > 0 && todos.every(todo => todo.completed),
            })}
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={hadleSubmit}>
            <input
              ref={todoFieldRef}
              value={query}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={event => setQuery(event.target.value)}
              disabled={isLoading}
            />
          </form>
        </header>

        {(todos.length > 0 || tempTodo) && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              {/* This is a completed todo */}
              {visibleTodos.map(todo => (
                <div
                  data-cy="Todo"
                  className={todo.completed ? 'todo completed' : 'todo'}
                  key={todo.id}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo)}
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {todo.title}
                  </span>

                  {/* Remove button appears only on hover */}
                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => removeTodo(todo.id)}
                  >
                    ×
                  </button>

                  {/* overlay will cover the todo while it is being deleted or updated */}
                  <div
                    data-cy="TodoLoader"
                    className={cn('modal overlay', {
                      'is-active': loadingIds.includes(todo.id),
                    })}
                  >
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              ))}

              {tempTodo && (
                <div data-cy="Todo" className="todo" key={0}>
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {tempTodo.title}
                  </span>

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                  >
                    ×
                  </button>

                  <div data-cy="TodoLoader" className="modal overlay is-active">
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              )}
            </section>

            {/* Hide the footer if there are no todos */}
            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {activeTodosCount} items left
              </span>

              {/* Active link should have the 'selected' class */}
              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={cn('filter__link', { selected: filter === 'all' })}
                  onClick={() => setFilter('all')}
                  data-cy="FilterLinkAll"
                >
                  All
                </a>

                <a
                  href="#/active"
                  className={cn('filter__link', {
                    selected: filter === 'active',
                  })}
                  onClick={() => setFilter('active')}
                  data-cy="FilterLinkActive"
                >
                  Active
                </a>

                <a
                  href="#/completed"
                  className={cn('filter__link', {
                    selected: filter === 'completed',
                  })}
                  onClick={() => setFilter('completed')}
                  data-cy="FilterLinkCompleted"
                >
                  Completed
                </a>
              </nav>

              {/* this button should be disabled if there are no completed todos */}
              {todos.some(todo => todo.completed) && (
                <button
                  type="button"
                  className="todoapp__clear-completed"
                  data-cy="ClearCompletedButton"
                >
                  Clear completed
                </button>
              )}
            </footer>
          </>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
