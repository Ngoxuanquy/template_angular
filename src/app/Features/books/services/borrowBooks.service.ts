import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { InitializeAppService } from '../../../core/services/app-config.service';

@Injectable({
  providedIn: 'root',
})
export class BorrowBooksService {
  apiUrl = '';
  datas: any;

  constructor(
    private cookieService: CookieService,
    private http: HttpClient,
    private message: NzMessageService,
    private router: Router,
    private initializeAppService: InitializeAppService,
  ) {
    this.apiUrl = this.initializeAppService.getApiUrl();
  }

  //lấy type để select
  getDataTypeBook(page: Number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/typeBook/getAll/${page}`).pipe(
      tap((data) => {
        return data;
      }),
      catchError(this.handleError('getData', [])),
    );
  }

  //lấy dữ liệu bảng mượn sách
  getData(page: Number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/borrowBook/getAll/${page}`).pipe(
      map((data) => {
        // You can add custom logic here to transform the data if needed
        this.datas = data;
        return data;
      }),
      catchError((error) => {
        // Log the error and rethrow it to propagate it to the subscriber
        throw error;
      }),
    );
  }

  //hàm xóa dấu
  removeAccents(str: any): any {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  //tìm kiếm
  search(searchs: any): Observable<any> {
    if (
      searchs.value.name_search !== '' &&
      searchs.value.name_user !== '' &&
      searchs.value.selectedValue !== ''
    ) {
      // Xóa dấu của tên sản phẩm
      const searchWithoutAccents = this.removeAccents(
        searchs.value.name_search.toLowerCase(),
      );

      // Xóa dấu của tên người mượns
      const searchName = this.removeAccents(
        searchs.value.name_user.toLowerCase(),
      );

      console.log({ data: this.datas });
      // xử lý tìm kiếm gần đúng và đã xóa dấu
      const results = this.datas.metadata.filter(
        (book: any) =>
          this.removeAccents(book.name_book.toLowerCase()).includes(
            searchWithoutAccents,
          ) &&
          book.type === searchs.value.selectedValue &&
          this.removeAccents(book.use_name.toLowerCase()).includes(searchName),
      );

      console.log({ results });

      // trả về mảng mới
      return of([...results]);
    } else {
      // Handle the case when not all information is provided
      this.message.create('warning', 'Vui lòng nhập đủ thông tin!!!', {
        nzDuration: 3000,
      });
      return of([]);
    }
  }

  borrowBooks(payload: any): Observable<any> {
    // Removed unused parameter

    return this.http
      .post<any>(`${this.apiUrl}/borrowBook/createBorrowBook`, {
        bookId: payload.bookId,
        name_book: payload.name_book,
        phone_number: Number(payload.phone_number),
        type: payload.type,
        use_name: payload.use_name,
        paymentDate: payload.paymentDate,
      })
      .pipe(
        tap((response) => {
          // Handle the response if needed
          // window.location.reload();
        }),
        catchError(this.handleError('borrowBooks')),
      );
  }

  reduceTheNumberOf(id: any, quantity: number): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/book/updateBookQuantity`, { id, quantity })
      .pipe(
        switchMap((response) => {
          // You can perform any additional logic with the response here if needed
          return response;
        }),
        catchError((error) => {
          // Handle error if needed
          console.error('Error deleting book', error);
          return throwError(error);
        }),
      );
  }

  giveBookBack(id: any, bookId: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/borrowBook/updateTraSach`, {
        id: id, // Use bookId instead of id
      })
      .pipe(
        tap(() => {
          this.message.create('success', 'Cập nhật thành công!!!', {
            nzDuration: 3000,
          });
          this.reduceTheNumberOf(bookId, -1).subscribe(
            (response) => {
              // Handle successful response here
            },
            (error) => {
              // Handle error here
              console.error('Error reducing book quantity', error);
            },
          );
        }),
        catchError((error) => {
          console.error('Error updating book', error);
          throw error; // Re-throw the error to propagate it further
        }),
      );
  }

  private handleError(operation = 'operation', result?: any) {
    return (error: any): Observable<any> => {
      console.error(`Error in ${operation}:`, error);
      // Let the app keep running by returning an empty result.
      return throwError(result);
    };
  }
}
