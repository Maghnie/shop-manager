import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductTags from '@/components/products/ProductTags';

describe('ProductTags Component', () => {
  it('should show dash when no tags', () => {
    render(<ProductTags tags={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should show dash when tags is null/undefined', () => {
    render(<ProductTags tags={null as any} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should display tags when less than or equal to 3', () => {
    const tags = ['مريح', 'خشبي'];
    render(<ProductTags tags={tags} />);

    expect(screen.getByText('مريح')).toBeInTheDocument();
    expect(screen.getByText('خشبي')).toBeInTheDocument();
  });

  it('should display first 3 tags and show overflow indicator', () => {
    const tags = ['مريح', 'خشبي', 'قوي', 'جميل', 'عملي'];
    render(<ProductTags tags={tags} />);

    // Should show first 3 tags
    expect(screen.getByText('مريح')).toBeInTheDocument();
    expect(screen.getByText('خشبي')).toBeInTheDocument();
    expect(screen.getByText('قوي')).toBeInTheDocument();

    // Should show overflow indicator
    expect(screen.getByText('+2')).toBeInTheDocument();

    // Should not show remaining tags directly
    expect(screen.queryByText('جميل')).not.toBeInTheDocument();
    expect(screen.queryByText('عملي')).not.toBeInTheDocument();
  });

  it('should show all tags in tooltip on hover', () => {
    const tags = ['مريح', 'خشبي', 'قوي', 'جميل', 'عملي'];
    render(<ProductTags tags={tags} />);

    const overflowIndicator = screen.getByText('+2').closest('div');
    
    // Hover over the overflow indicator
    fireEvent.mouseEnter(overflowIndicator!);

    // All tags should be visible in tooltip
    expect(screen.getAllByText('مريح')).toHaveLength(2); // One in main display, one in tooltip
    expect(screen.getAllByText('خشبي')).toHaveLength(2);
    expect(screen.getAllByText('قوي')).toHaveLength(2);
    expect(screen.getByText('جميل')).toBeInTheDocument();
    expect(screen.getByText('عملي')).toBeInTheDocument();
  });
});
