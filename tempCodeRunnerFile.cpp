#include <bits/stdc++.h>
using namespace std;
#define ll long long

int main() {

    ll t;
    cin>>t;

    while(t--) {
       ll a,x,y;
       cin>>a>>x>>y;

       if(a>=min(x,y)&&a<=max(x,y)) {
        cout<<"NO"<<endl;
       }

       else {
        cout<<"YES"<<endl;
       }
    }
}