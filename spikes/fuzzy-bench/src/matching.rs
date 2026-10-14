use frizbee::{Match, SortStrategy};
use nucleo_matcher::{
    Utf32Str, chars,
    pattern::{Atom, AtomKind, CaseMatching, Normalization},
};

use crate::TOP_COUNT;

enum PreparedPath<'a> {
    Ascii(&'a [u8]),
    Unicode(Box<[char]>),
}

impl PreparedPath<'_> {
    fn as_utf32(&self) -> Utf32Str<'_> {
        match self {
            Self::Ascii(bytes) => Utf32Str::Ascii(bytes),
            Self::Unicode(chars) => Utf32Str::Unicode(chars),
        }
    }
}

pub struct NucleoIndex<'a>(Vec<PreparedPath<'a>>);

impl<'a> NucleoIndex<'a> {
    pub fn new<S: AsRef<str>>(names: &'a [S]) -> Self {
        Self(
            names
                .iter()
                .map(|name| {
                    let name = name.as_ref();
                    if name.is_ascii() {
                        PreparedPath::Ascii(name.as_bytes())
                    } else {
                        PreparedPath::Unicode(chars::graphemes(name).collect())
                    }
                })
                .collect(),
        )
    }

    fn search(&self, query: &str) -> Vec<Match> {
        let mut matcher =
            nucleo_matcher::Matcher::new(nucleo_matcher::Config::DEFAULT.match_paths());
        let pattern = Atom::new(
            query,
            CaseMatching::Smart,
            Normalization::Smart,
            AtomKind::Fuzzy,
            false,
        );
        let matches = self
            .0
            .iter()
            .enumerate()
            .filter_map(|(index, name)| {
                pattern
                    .score(name.as_utf32(), &mut matcher)
                    .map(|score| Match {
                        score,
                        index: index as u32,
                        exact: false,
                    })
            })
            .collect();
        top_matches(matches)
    }
}

#[derive(Clone, Copy)]
pub enum Engine {
    Nucleo,
    Frizbee,
    FrizbeeTypos,
}

impl Engine {
    pub const ALL: [Self; 3] = [Self::Nucleo, Self::Frizbee, Self::FrizbeeTypos];

    pub fn label(self) -> &'static str {
        match self {
            Self::Nucleo => "nucleo",
            Self::Frizbee => "frizbee",
            Self::FrizbeeTypos => "frizbee+typos",
        }
    }

    pub fn search<S: AsRef<str>>(
        self,
        names: &[S],
        index: &NucleoIndex<'_>,
        query: &str,
    ) -> Vec<Match> {
        match self {
            Self::Nucleo => index.search(query),
            Self::Frizbee | Self::FrizbeeTypos => {
                let typos = if matches!(self, Self::FrizbeeTypos) {
                    (query.chars().count() / 4).min(2) as u16
                } else {
                    0
                };
                let config = frizbee::Config::default()
                    .sort(SortStrategy::IndexAsc)
                    .max_typos(Some(typos));
                let mut matcher = frizbee::Matcher::new(query, &config);
                top_matches(matcher.match_list(names))
            }
        }
    }
}

fn top_matches(mut matches: Vec<Match>) -> Vec<Match> {
    if matches.len() > TOP_COUNT {
        matches.select_nth_unstable(TOP_COUNT);
        matches.truncate(TOP_COUNT);
    }
    matches.sort_unstable();
    matches
}
