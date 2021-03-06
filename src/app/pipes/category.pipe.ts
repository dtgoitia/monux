import { Pipe, PipeTransform } from '@angular/core'
import { TitleCasePipe } from '@angular/common'

@Pipe({ name: 'category' })
export class CategoryPipe implements PipeTransform {
  constructor(private titleCasePipe: TitleCasePipe) {}

  transform(string: string): string {
    const stripped = string.replace(/_/g, ' ')
    return this.titleCasePipe.transform(stripped)
  }
}
