import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';

describe('Button Component', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该在禁用时不触发点击', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该显示加载状态', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('应该在加载时禁用按钮', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Submit</Button>);

    const button = screen.getByText('加载中...').closest('button');
    expect(button).toBeDisabled();

    if (button) {
      fireEvent.click(button);
    }
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该应用正确的变体样式', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-200');

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByText('Danger');
    expect(button).toHaveClass('bg-red-600');
  });

  it('应该应用正确的大小样式', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByText('Small');
    expect(button).toHaveClass('px-3');

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByText('Medium');
    expect(button).toHaveClass('px-4');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button).toHaveClass('px-6');
  });

  it('应该应用自定义类名', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('应该传递其他 HTML 属性', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
