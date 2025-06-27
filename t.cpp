#include <bits/stdc++.h>
using namespace std;
#define ll long long

ll countTriplets(vector<ll>& arr, ll target) {
    ll n = arr.size();
  ll count = 0;
  ll a = 0;


    for(ll i=0;i<n-2;i++) {

        for(ll j = i+2;j<n;j++) {

            ll l = i+1;
            ll r = j-1;

            ll val = -1;
            while(l<=r) {
                ll mid = (l+r)/2;
                if(arr[i]+arr[mid]+arr[j]>target) {
                    if(arr[i]+arr[mid]<=arr[j]) {
                        l = mid+1;
                    }
                    else {
                        val = mid;
                        r = mid-1;
                    }
                } 

                else {
                    l = mid+1;
                }
            }

            if(val!=-1) {
                count+=(j-val);
            }
        }
    }

    return count;
}


ll countPairs(vector<ll>& nums, ll target) {
    ll n = nums.size();
    sort(nums.begin(), nums.end());
    ll count = 0;
    ll left = 0, right = n - 1;

    while (left < right) {
        ll sum = nums[left] + nums[right];
        if (sum > target) {
            count += (right - left);
            right--;
        } else {
            left++;
        }

       
    }

    return count;
}



int main() {
    ll t;
    cin >> t;

    while (t--) {
        ll n;
        cin >> n;
        vector<ll> arr(n);
        for (ll i = 0; i < n; i++) {
            cin >> arr[i];
        }

        sort(arr.begin(), arr.end());
        ll maxy = arr[n - 1];
        arr.pop_back();

        ll a = countTriplets(arr, maxy);
        ll b = countPairs(arr, maxy);

        cout<<a+b<<endl;
    }
}
