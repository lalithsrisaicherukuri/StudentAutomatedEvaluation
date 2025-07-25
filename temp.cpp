#include <bits/stdc++.h>
using namespace std;

/*
 * Returns the minimum extra time to transmit the string.
 * sameTime      : cost for every identical‑character pair inside one chunk
 * partitionTime : cost for creating one partition
 * s             : the string to send
 */
long long getMinimumTime(int sameTime, int partitionTime, const string& s) {
    int n = static_cast<int>(s.size());
    const long long INF = LLONG_MAX / 4;

    vector<long long> dp(n + 1, INF);
    dp[0] = 0;                       // empty prefix costs nothing

    for (int i = 1; i <= n; ++i) {
        int freq[26] = {0};
        long long identicalPairs = 0;

        // Extend current chunk leftwards
        for (int j = i; j >= 1; --j) {
            int idx = s[j - 1] - 'a';
            identicalPairs += freq[idx];   // new pairs formed with this char
            ++freq[idx];

            long long cost = dp[j - 1] +
                             identicalPairs * 1LL * sameTime +
                             (j > 1 ? partitionTime : 0);
            dp[i] = min(dp[i], cost);
        }
    }
    return dp[n];
}

int main() {
    int sameTime, partitionTime;
    string s;
    cin >> sameTime >> partitionTime >> s;
    cout << getMinimumTime(sameTime, partitionTime, s) << '\n';
    return 0;
}

