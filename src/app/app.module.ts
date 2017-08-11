import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http'
import { NgReduxModule, NgRedux, DevToolsExtension } from '@angular-redux/store'

import rootReducer from './reducers'
import middleware from './middleware'
import { AppState } from './store'

import { MonzoService } from './services/monzo.service'

import { AppComponent } from './app.component'
import { AmountComponent } from './components/amount.component'
import { AccountComponent } from './components/account.component'

@NgModule({
  declarations: [AppComponent, AmountComponent, AccountComponent],
  imports: [BrowserModule, HttpClientModule, NgReduxModule],
  providers: [MonzoService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    private readonly redux: NgRedux<AppState>,
    private readonly devTools: DevToolsExtension
  ) {
    // You probably only want to expose this tool in devMode.
    const enhancers = this.devTools.isEnabled()
      ? [this.devTools.enhancer()]
      : []

    this.redux.configureStore(
      rootReducer,
      {} as AppState,
      middleware,
      enhancers
    )
  }
}
