#include <bits/stdc++.h>
using namespace std;
#define ll long long
const ll MOD  = 998244353;

ll rec(ll ind,ll cap,vector<vector<ll>>&dp,vector<ll>&arr,ll a,ll b) {

    ll n = arr.size();
    if(ind==n)return 0;
    ll val = 0;
    if(cap!=0)val = arr[cap-1];

    if(dp[ind][cap]!=-1)return dp[ind][cap];

    ll ans = LLONG_MAX;
    ll x = b*(arr[ind]-val)+rec(ind+1,cap,dp,arr,a,b);
    ans = min(ans,x);
    ll y = b*(arr[ind]-val)+a*(arr[ind]-val)+rec(ind+1,ind+1,dp,arr,a,b);
    ans = min(ans,y);

    return dp[ind][cap] = ans;
}

int main() {
    ll t;
    cin >> t;

    while (t--) {
        ll n;
        cin >> n;
        vector<ll> arr(n);

        ll a,b;
        cin>>a>>b;

        for (ll i = 0; i < n; i++) {
            cin >> arr[i];
        }
        
        // vector<vector<ll>>dp(n+1,vector<ll>(n+1,-1));
        // cout<<rec(0,0,dp,arr,a,b)<<endl;

        ll ans = 0;
        ll prev = 0;
        for(ll i = 0;i<n;i++) {
            ans+=b*(arr[i]-prev);
            if(i==n-1)continue;
            ll rem = n-1-i;
            if(rem*b*(arr[i]-prev)>a*(arr[i]-prev)) {
                ans+=a*(arr[i]-prev);
                prev = arr[i];
            }
        }
        cout<<ans<<endl;
    }
}
