import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PAGE_SIZE_OPTIONS } from '../../constants/constants';

/** Page navigation + page-size selector for client-side pagination. */
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>(PAGE_SIZE_OPTIONS);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );
  readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * this.pageSize() + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.totalItems(), (this.page() + 1) * this.pageSize()),
  );

  onPageSizeChange(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
